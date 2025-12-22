import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import Papa from 'papaparse'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

async function getUserId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload.userId as string
    } catch {
        return null
    }
}

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
    return value.replace(/"/g, '""').trim()
}

// Enhanced type inference with data cleaning
function inferTypeAndClean(value: any): { type: string, cleanedValue: any, issues: string[] } {
    const issues: string[] = []
    let cleanedValue = value
    
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        const text = await file.text()
        const parsed = Papa.parse(text, { 
            header: true, 
            skipEmptyLines: true,
            transform: (value, field) => {
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
            
            return NextResponse.json({ 
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
            return NextResponse.json({ error: 'CSV is empty' }, { status: 400 })
        }

        // Analyze first 10 rows for preview
        const headers = Object.keys(rows[0])
        const sanitizedHeaders = headers.map(sanitizeColumnName)
        const previewRows = rows.slice(0, 10)
        
        // Analyze data quality and types
        const columnAnalysis = headers.map((header, index) => {
            const columnIssues: string[] = []
            const sampleValues = []
            let finalType = 'TEXT'
            let nullCount = 0
            
            // Analyze sample values
            for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const val = rows[i][header]
                if (val === null || val === undefined || val === '') {
                    nullCount++
                    continue
                }
                
                const analysis = inferTypeAndClean(val)
                sampleValues.push(analysis)
                columnIssues.push(...analysis.issues)
                
                // Determine final type
                if (analysis.type === 'TEXT') finalType = 'TEXT'
                else if (analysis.type === 'DECIMAL' && finalType !== 'TEXT') finalType = 'DECIMAL'
                else if (analysis.type === 'DATE' && finalType !== 'TEXT' && finalType !== 'DECIMAL') finalType = 'DATE'
            }
            
            return {
                original: header,
                sanitized: sanitizedHeaders[index],
                type: finalType === 'DATE' ? 'TIMESTAMP' : finalType,
                issues: [...new Set(columnIssues)],
                nullCount,
                completeness: ((rows.length - nullCount) / rows.length * 100).toFixed(1)
            }
        })

        // Clean preview data for display
        const cleanedPreviewRows = previewRows.map(row => {
            const cleanedRow: any = {}
            headers.forEach(header => {
                const analysis = inferTypeAndClean(row[header])
                cleanedRow[header] = {
                    original: row[header],
                    cleaned: analysis.cleanedValue,
                    issues: analysis.issues
                }
            })
            return cleanedRow
        })

        const dataQualityReport = {
            totalRows: rows.length,
            columns: headers.length,
            completeness: (rows.filter(row => 
                headers.some(h => row[h] !== null && row[h] !== undefined && row[h] !== '')
            ).length / rows.length * 100).toFixed(1),
            issuesFound: columnAnalysis.filter(col => col.issues.length > 0).length,
            cleaningRequired: columnAnalysis.some(col => col.issues.length > 0)
        }

        return NextResponse.json({
            success: true,
            preview: {
                headers: columnAnalysis,
                rows: cleanedPreviewRows,
                totalRows: rows.length,
                previewRows: previewRows.length
            },
            dataQualityReport,
            recommendations: generateRecommendations(columnAnalysis, dataQualityReport)
        })

    } catch (error) {
        console.error('Preview error:', error)
        return NextResponse.json({ error: 'Failed to preview file' }, { status: 500 })
    }
}

function generateRecommendations(columnAnalysis: any[], qualityReport: any): string[] {
    const recommendations: string[] = []
    
    if (qualityReport.cleaningRequired) {
        recommendations.push('Data cleaning will be applied automatically during import')
    }
    
    const currencyColumns = columnAnalysis.filter(col => 
        col.issues.includes('Currency symbols removed')
    ).length
    
    if (currencyColumns > 0) {
        recommendations.push(`${currencyColumns} column(s) contain currency symbols that will be removed`)
    }
    
    const dateColumns = columnAnalysis.filter(col => 
        col.issues.includes('Date format normalized')
    ).length
    
    if (dateColumns > 0) {
        recommendations.push(`${dateColumns} date column(s) will be normalized to YYYY-MM-DD format`)
    }
    
    const lowCompleteness = columnAnalysis.filter(col => 
        parseFloat(col.completeness) < 80
    ).length
    
    if (lowCompleteness > 0) {
        recommendations.push(`${lowCompleteness} column(s) have less than 80% data completeness`)
    }
    
    if (qualityReport.totalRows > 10000) {
        recommendations.push('Large file detected - processing may take a few moments')
    }
    
    return recommendations
}
