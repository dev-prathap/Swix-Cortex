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

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { dataSourceId, sql } = await req.json()

        if (!dataSourceId || !sql) {
            return NextResponse.json({ error: 'Missing dataSourceId or sql' }, { status: 400 })
        }

        // Verify data source belongs to user
        const dataSource = await prisma.dataSource.findUnique({
            where: { id: dataSourceId },
        })

        if (!dataSource || dataSource.userId !== userId) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // Parse connection details
        let connectionConfig = {}
        try {
            const details = JSON.parse(dataSource.connectionDetails)
            if (details.connectionString) {
                connectionConfig = { connectionString: details.connectionString }
            } else {
                // Handle other formats if needed, e.g. host, port, etc.
                // For now we assume connectionString for Postgres based on our seed
                connectionConfig = details
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid connection details' }, { status: 500 })
        }

        if (dataSource.type === 'POSTGRES') {
            const client = new Client(connectionConfig)
            try {
                await client.connect()
                const result = await client.query(sql)
                await client.end()

                // Format results for UI
                // result.fields contains column info, result.rows contains data
                const columns = result.fields.map((f: any) => f.name)
                const rows = result.rows

                return NextResponse.json({
                    columns,
                    rows,
                    message: 'Query executed successfully'
                })
            } catch (dbError: any) {
                console.error('Database execution error:', dbError)
                await client.end().catch(() => { }) // Ensure cleanup
                return NextResponse.json({ error: dbError.message || 'Failed to execute query on database' }, { status: 400 })
            }
        } else {
            return NextResponse.json({ error: `Execution for ${dataSource.type} not implemented yet` }, { status: 501 })
        }

    } catch (error) {
        console.error('Query execution error:', error)
        return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 })
    }
}
