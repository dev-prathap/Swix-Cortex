import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import Papa from 'papaparse'
import { Client } from 'pg'

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

// Helper to infer Postgres type from value
function inferType(value: any): string {
    if (value === null || value === undefined || value === '') return 'TEXT'
    if (!isNaN(Number(value))) {
        return Number.isInteger(Number(value)) ? 'INTEGER' : 'DECIMAL'
    }
    const date = Date.parse(value)
    if (!isNaN(date) && value.length > 4) return 'TIMESTAMP' // Simple check
    return 'TEXT'
}

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const name = formData.get('name') as string

        if (!file || !name) {
            return NextResponse.json({ error: 'File and name are required' }, { status: 400 })
        }

        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

        if (parsed.errors.length > 0) {
            return NextResponse.json({ error: 'CSV parsing error', details: parsed.errors }, { status: 400 })
        }

        const rows = parsed.data as any[]
        if (rows.length === 0) {
            return NextResponse.json({ error: 'CSV is empty' }, { status: 400 })
        }

        // 1. Determine Schema
        const headers = Object.keys(rows[0])
        const sanitizedHeaders = headers.map(sanitizeColumnName)
        const columnTypes = sanitizedHeaders.map((header, index) => {
            // Check first few rows to infer type
            for (let i = 0; i < Math.min(rows.length, 10); i++) {
                const val = rows[i][headers[index]]
                const type = inferType(val)
                if (type === 'TEXT') return 'TEXT' // Fallback to TEXT if any value is text
                if (type === 'DECIMAL') return 'DECIMAL' // Upgrade INT to DECIMAL
            }
            return 'INTEGER' // Default if all look like ints
        })

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
                const rowValues = headers.map(h => {
                    const val = row[h]
                    return val === '' ? null : val
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
            return NextResponse.json({ success: true, dataSource })

        } catch (dbError: any) {
            await client.end()
            console.error('DB Error:', dbError)
            return NextResponse.json({ error: 'Database error during ingestion', details: dbError.message }, { status: 500 })
        }

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
    }
}
