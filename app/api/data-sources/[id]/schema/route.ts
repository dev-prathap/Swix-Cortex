import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const dataSource = await prisma.dataSource.findUnique({
            where: { id, userId }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        let schema: any = {}

        if (dataSource.type === 'POSTGRES') {
            let connectionConfig: any = {}
            let tableName: string | undefined

            try {
                const details = JSON.parse(dataSource.connectionDetails)
                if (details.connectionString) {
                    connectionConfig = { connectionString: details.connectionString }
                } else {
                    connectionConfig = details
                }
                tableName = details.tableName // For ingested CSVs
            } catch (e) {
                return NextResponse.json({ error: 'Invalid connection details' }, { status: 500 })
            }

            const client = new Client(connectionConfig)
            await client.connect()

            try {
                // If it's a specific table (CSV ingest), just describe that table
                // If it's a full DB connection, we might want to list all tables or limit to public schema
                // For now, let's assume if tableName is present, we only care about that one.
                // Otherwise, we list all tables in public schema.

                if (tableName) {
                    const res = await client.query(`
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                    `, [tableName])

                    schema = {
                        tables: [{
                            name: tableName,
                            columns: res.rows.map(row => ({
                                name: row.column_name,
                                type: row.data_type
                            }))
                        }]
                    }
                } else {
                    // List all tables in public schema
                    const tablesRes = await client.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public'
                    `)

                    const tables = []
                    for (const row of tablesRes.rows) {
                        const colsRes = await client.query(`
                            SELECT column_name, data_type 
                            FROM information_schema.columns 
                            WHERE table_name = $1
                        `, [row.table_name])

                        tables.push({
                            name: row.table_name,
                            columns: colsRes.rows.map(col => ({
                                name: col.column_name,
                                type: col.data_type
                            }))
                        })
                    }
                    schema = { tables }
                }
            } finally {
                await client.end()
            }
        } else {
            return NextResponse.json({ error: 'Schema introspection not supported for this type yet' }, { status: 501 })
        }

        return NextResponse.json(schema)

    } catch (error) {
        console.error('Schema fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 })
    }
}
