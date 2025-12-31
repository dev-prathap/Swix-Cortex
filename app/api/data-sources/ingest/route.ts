import prisma from '@/lib/prisma'
import { getUserId } from '@/lib/auth'
import { safeJsonResponse } from '@/lib/utils/serialization'
import Papa from 'papaparse'
import { Client } from 'pg'

// Helper to sanitize column names
function sanitizeColumnName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'col'
}

// Enhanced data cleaning functions
function cleanCurrencyValue(value: string): string {
    return value.replace(/[$,]/g, '').trim()
}

function normalizeDate(value: string): string {
    if (!value || typeof value !== 'string') return value

    const strValue = value.trim()

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
        return strValue
    }

    try {
        let date: Date | null = null

        // Handle "Mar 11, 2025" format
        if (/^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(strValue)) {
            date = new Date(strValue)
        }
        // Handle "3/28/2025" or "03/28/2025" format
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(strValue)) {
            const parts = strValue.split('/')
            const month = parseInt(parts[0], 10)
            const day = parseInt(parts[1], 10)
            const year = parseInt(parts[2], 10)
            date = new Date(year, month - 1, day) // month is 0-indexed
        }
        // Handle "MM-DD-YYYY" format
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(strValue)) {
            const parts = strValue.split('-')
            const month = parseInt(parts[0], 10)
            const day = parseInt(parts[1], 10)
            const year = parseInt(parts[2], 10)
            date = new Date(year, month - 1, day)
        }
        // Try generic Date parsing as fallback
        else {
            date = new Date(strValue)
        }

        if (date && !isNaN(date.getTime())) {
            // Format as YYYY-MM-DD
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
    } catch (error) {
        console.warn('Date parsing failed for value:', strValue, error)
    }

    // If all parsing fails, return original value
    return strValue
}

function cleanTextValue(value: string): string {
    return value.replace(/"/g, '""').trim() // Escape quotes for CSV
}

// Enhanced type inference with data cleaning
function inferTypeAndClean(value: any): { type: string, cleanedValue: any, issues: string[] } {
    const issues: string[] = []
    const cleanedValue = value

    if (value === null || value === undefined || value === '') {
        return { type: 'TEXT', cleanedValue: null, issues: [] }
    }

    const strValue = String(value).trim()

    // Check for currency format
    if (/^\$?[\d,]+\.?\d*$/.test(strValue)) {
        const cleaned = cleanCurrencyValue(strValue)
        if (!isNaN(Number(cleaned))) {
            issues.push('Currency symbols removed')
            return {
                type: Number.isInteger(Number(cleaned)) ? 'INTEGER' : 'DECIMAL',
                cleanedValue: Number(cleaned),
                issues
            }
        }
    }

    // Check for numeric values
    if (!isNaN(Number(strValue))) {
        return {
            type: Number.isInteger(Number(strValue)) ? 'INTEGER' : 'DECIMAL',
            cleanedValue: Number(strValue),
            issues
        }
    }

    // Check for date formats
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
        /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/, // Mar 11, 2025
        /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
    ]

    if (datePatterns.some(pattern => pattern.test(strValue))) {
        const normalized = normalizeDate(strValue)
        if (normalized !== strValue) {
            issues.push('Date format normalized')
        }
        return { type: 'DATE', cleanedValue: normalized, issues }
    }

    // Default to TEXT with cleaning
    return {
        type: 'TEXT',
        cleanedValue: cleanTextValue(strValue),
        issues
    }
}

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const name = formData.get('name') as string

        if (!file || !name) {
            return safeJsonResponse({ error: 'File and name are required' }, { status: 400 })
        }

        const text = await file.text()
        // Enhanced CSV parsing with better error handling
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transform: (value, field) => {
                // Basic cleaning during parse
                return typeof value === 'string' ? value.trim() : value
            }
        })

        if (parsed.errors.length > 0) {
            const errorDetails = parsed.errors.map(err => ({
                type: err.type,
                code: err.code,
                message: err.message,
                row: err.row
            }))

            return safeJsonResponse({
                error: 'CSV parsing failed',
                message: 'Your CSV file has formatting issues that prevent processing.',
                details: errorDetails,
                suggestions: [
                    'Check for unescaped quotes in text fields',
                    'Ensure consistent number of columns across all rows',
                    'Verify file encoding (UTF-8 recommended)'
                ]
            }, { status: 400 })
        }

        const rows = parsed.data as any[]
        if (rows.length === 0) {
            return safeJsonResponse({ error: 'CSV is empty' }, { status: 400 })
        }

        // 1. Enhanced Schema Detection with Data Cleaning
        const headers = Object.keys(rows[0])
        const sanitizedHeaders = headers.map(sanitizeColumnName)
        const dataQualityReport = {
            totalRows: rows.length,
            columns: headers.length,
            issues: [] as string[],
            cleaningApplied: [] as string[]
        }

        // Step 1: Analyze sample data for type inference
        const columnAnalysis = sanitizedHeaders.map((header, index) => {
            const originalHeader = headers[index]
            const columnIssues: string[] = []
            const sampleValues = []
            let finalType = 'TEXT'

            // Analyze sample of values for type inference only
            for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const val = rows[i][originalHeader]
                if (val !== null && val !== undefined && val !== '') {
                    const analysis = inferTypeAndClean(val)
                    sampleValues.push(analysis)

                    // Track issues
                    columnIssues.push(...analysis.issues)

                    // Determine final type (most restrictive wins)
                    if (analysis.type === 'TEXT') finalType = 'TEXT'
                    else if (analysis.type === 'DECIMAL' && finalType !== 'TEXT') finalType = 'DECIMAL'
                    else if (analysis.type === 'DATE' && finalType !== 'TEXT' && finalType !== 'DECIMAL') finalType = 'DATE'
                }
            }

            // Convert DATE to TIMESTAMP for PostgreSQL
            if (finalType === 'DATE') finalType = 'TIMESTAMP'

            if (columnIssues.length > 0) {
                dataQualityReport.cleaningApplied.push(`${originalHeader}: ${[...new Set(columnIssues)].join(', ')}`)
            }

            return { header: originalHeader, sanitized: header, type: finalType, issues: columnIssues }
        })

        // Step 2: Clean ALL rows based on inferred types
        console.log('Cleaning all rows with inferred types...')
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < headers.length; j++) {
                const originalHeader = headers[j]
                const columnType = columnAnalysis[j].type
                const val = rows[i][originalHeader]

                if (val !== null && val !== undefined && val !== '') {
                    const analysis = inferTypeAndClean(val)

                    // Apply cleaning based on expected type
                    if (columnType === 'DECIMAL' || columnType === 'INTEGER') {
                        // Force numeric cleaning for numeric columns
                        const strValue = String(val).trim()
                        if (/^\$?[\d,]+\.?\d*$/.test(strValue)) {
                            rows[i][originalHeader] = Number(cleanCurrencyValue(strValue))
                        } else if (!isNaN(Number(strValue))) {
                            rows[i][originalHeader] = Number(strValue)
                        }
                    } else if (columnType === 'TIMESTAMP') {
                        // Force date cleaning for date columns
                        rows[i][originalHeader] = normalizeDate(String(val))
                    } else {
                        // Use cleaned value for text columns
                        rows[i][originalHeader] = analysis.cleanedValue
                    }
                }
            }
        }
        console.log('Data cleaning completed for all rows')

        const columnTypes = columnAnalysis.map(col => col.type)

        // 2. Create Table
        const tableName = `ingest_${userId.replace(/-/g, '_')}_${Date.now()}`
        const createTableSQL = `
            CREATE TABLE "${tableName}" (
                id SERIAL PRIMARY KEY,
                ${sanitizedHeaders.map((h, i) => `"${h}" ${columnTypes[i]}`).join(',\n')}
            );
        `

        // Use pg client for DDL
        const client = new Client({ connectionString: process.env.DATABASE_URL })
        await client.connect()

        try {
            await client.query(createTableSQL)

            // 3. Insert Data
            // Construct bulk insert query
            // Note: For very large files, we should use COPY or streams. For MVP, batch insert is okay.
            const values: any[] = []
            const placeholders: string[] = []

            rows.forEach((row, rowIndex) => {
                const rowValues = headers.map((h, colIndex) => {
                    const val = row[h]
                    const columnType = columnAnalysis[colIndex].type

                    // Handle empty values
                    if (val === '' || val === null || val === undefined) {
                        return null
                    }

                    // Ensure proper type conversion for database
                    if (columnType === 'DECIMAL' || columnType === 'INTEGER') {
                        const numVal = Number(val)
                        return isNaN(numVal) ? null : numVal
                    }

                    return val
                })

                const rowPlaceholders = rowValues.map((_, colIndex) => `$${rowIndex * headers.length + colIndex + 1}`)
                placeholders.push(`(${rowPlaceholders.join(',')})`)
                values.push(...rowValues)
            })

            const insertSQL = `
                INSERT INTO "${tableName}" (${sanitizedHeaders.map(h => `"${h}"`).join(',')})
                VALUES ${placeholders.join(',')}
            `

            await client.query(insertSQL, values)

            // 4. Save DataSource Record
            const dataSource = await prisma.dataSource.create({
                data: {
                    userId,
                    name: name,
                    type: 'POSTGRES', // It's technically a Postgres table now!
                    connectionDetails: JSON.stringify({
                        connectionString: process.env.DATABASE_URL,
                        tableName: tableName, // Store the specific table name
                        isIngested: true
                    })
                }
            })

            await client.end()
            return safeJsonResponse({
                success: true,
                dataSource,
                dataQualityReport,
                message: `Successfully processed ${rows.length} rows with ${headers.length} columns`,
                processingStats: {
                    rowsProcessed: rows.length,
                    columnsCreated: headers.length,
                    tableName: tableName,
                    cleaningApplied: dataQualityReport.cleaningApplied.length > 0
                }
            })

        } catch (dbError: any) {
            await client.end()
            console.error('DB Error:', dbError)

            // Provide specific error messages based on error type
            let userMessage = 'Database error occurred during data processing'
            let suggestions: string[] = []

            if (dbError.message.includes('invalid input syntax')) {
                userMessage = 'Data type mismatch detected'
                suggestions = [
                    'Some values in your CSV don\'t match the expected data types',
                    'Check for special characters in numeric fields',
                    'Ensure date fields follow consistent format'
                ]
            } else if (dbError.message.includes('duplicate key')) {
                userMessage = 'Duplicate data detected'
                suggestions = ['Remove duplicate rows from your CSV file']
            } else if (dbError.message.includes('column') && dbError.message.includes('does not exist')) {
                userMessage = 'Column mapping error'
                suggestions = ['Check your CSV headers for special characters or duplicates']
            }

            return safeJsonResponse({
                error: userMessage,
                message: 'We encountered an issue processing your data.',
                technicalDetails: dbError.message,
                suggestions,
                dataQualityReport
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Upload error:', error)
        return safeJsonResponse({ error: 'Failed to process upload' }, { status: 500 })
    }
}
