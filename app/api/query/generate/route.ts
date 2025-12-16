import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Client } from 'pg'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

// Helper to get user ID from token
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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
})

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { prompt, dataSourceId } = await req.json()

        if (!prompt || !dataSourceId) {
            return NextResponse.json({ error: 'Missing prompt or dataSourceId' }, { status: 400 })
        }

        // Fetch data source details to understand schema (mocking schema for now)
        const dataSource = await prisma.dataSource.findUnique({
            where: { id: dataSourceId, userId }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // Introspect Schema
        let schemaContext = ""

        if (dataSource.type === 'POSTGRES') {
            let connectionConfig: any = {}
            let tableName: string | undefined

            try {
                const details = JSON.parse(dataSource.connectionDetails)
                console.log(`[Debug] Source: ${dataSource.name} (${dataSourceId})`)
                console.log(`[Debug] Details:`, details)

                if (details.connectionString) {
                    connectionConfig = { connectionString: details.connectionString }
                } else {
                    connectionConfig = details
                }
                tableName = details.tableName
                console.log(`[Debug] Extracted tableName: ${tableName}`)
            } catch (e) {
                return NextResponse.json({ error: 'Invalid connection details' }, { status: 500 })
            }

            const client = new Client(connectionConfig)
            // We need to import Client from pg at the top if not already there. 
            // Since I am replacing a block, I should ensure imports are correct in a separate step or assume they are there?
            // The previous file content didn't have 'pg' import. I need to add it.
            // I will add the import in a separate edit or use full file replacement if easier.
            // Let's try to add the import first? No, I can't do two edits in one tool call unless I use multi_replace.
            // I'll assume I need to add the import. I'll use multi_replace to add import AND update logic.
            // Wait, I am using replace_file_content. I should probably use multi_replace to be safe.
            // But I'll stick to the instruction: "Replace the hardcoded schema context..."
            // I will handle the import in a separate tool call to be safe, or just use multi_replace now.
            // I'll use multi_replace.

            // Wait, I cannot switch tools inside the thought process.
            // I will use multi_replace_file_content instead of replace_file_content.

            // ... (Logic continues in the tool call)

            await client.connect()

            try {
                if (tableName) {
                    const res = await client.query(`
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                    `, [tableName])

                    const columns = res.rows.map((r: any) => `${r.column_name} (${r.data_type})`).join(', ')
                    schemaContext = `Table '${tableName}' with columns: ${columns}`
                } else {
                    // Limit to first 5 tables
                    const tablesRes = await client.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        LIMIT 5
                    `)

                    const tables = []
                    for (const row of tablesRes.rows) {
                        const colsRes = await client.query(`
                            SELECT column_name, data_type 
                            FROM information_schema.columns 
                            WHERE table_name = $1
                        `, [row.table_name])
                        const columns = colsRes.rows.map((r: any) => `${r.column_name} (${r.data_type})`).join(', ')
                        tables.push(`Table '${row.table_name}': ${columns}`)
                    }
                    schemaContext = tables.join('\n')
                }
            } finally {
                await client.end()
            }
        } else {
            // Fallback for other types if implemented later
            schemaContext = "Schema introspection not available for this source type."
        }

        const systemPrompt = `
      You are an expert SQL data analyst. 
      Your task is to convert the user's natural language question into a valid SQL query based on the provided schema.
      
      Schema:
      ${schemaContext}
      
      Rules:
      1. Return ONLY the SQL query. No markdown, no explanations.
      2. Use standard PostgreSQL syntax.
      3. ALWAYS wrap table names and column names in double quotes (e.g. "TableName", "ColumnName") to preserve case sensitivity.
      4. The table name in the schema might be a generated ID (e.g. "ingest_..."). Use it EXACTLY as provided.
      5. If the question cannot be answered with the schema, return "ERROR: Cannot answer".
    `

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o",
        })

        let generatedSQL = completion.choices[0].message.content?.trim()

        if (generatedSQL) {
            // Remove markdown code blocks if present
            generatedSQL = generatedSQL.replace(/```sql\n?/g, '').replace(/```/g, '').trim()
        }

        if (!generatedSQL || generatedSQL.startsWith("ERROR")) {
            console.error('AI Generation Failed. Schema:', schemaContext)
            console.error('Generated SQL:', generatedSQL)
            return NextResponse.json({ error: 'Could not generate query' }, { status: 400 })
        }

        // Save query history
        await prisma.queryHistory.create({
            data: {
                userId,
                prompt,
                generatedSQL,
            }
        })

        return NextResponse.json({ sql: generatedSQL })

    } catch (error) {
        console.error('AI Query error:', error)
        return NextResponse.json({ error: 'Failed to generate query' }, { status: 500 })
    }
}
