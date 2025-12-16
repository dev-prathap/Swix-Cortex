import { NextResponse } from 'next/server'
import OpenAI from 'openai'
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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
})

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { dataSourceId } = await req.json()

        if (!dataSourceId) {
            return NextResponse.json({ error: 'Missing dataSourceId' }, { status: 400 })
        }

        // 1. Fetch Data Source
        const dataSource = await prisma.dataSource.findUnique({
            where: { id: dataSourceId, userId }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // 2. Introspect Schema (Reuse logic or call internal API)
        // For speed, we'll duplicate the introspection logic here briefly or just use the connection details
        let schemaSummary = ""

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
                tableName = details.tableName
            } catch (e) {
                return NextResponse.json({ error: 'Invalid connection details' }, { status: 500 })
            }

            const client = new Client(connectionConfig)
            await client.connect()

            try {
                if (tableName) {
                    const res = await client.query(`
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                    `, [tableName])

                    const columns = res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', ')
                    schemaSummary = `Table '${tableName}' with columns: ${columns}`
                } else {
                    // Limit to first 5 tables to avoid huge prompt
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
                        const columns = colsRes.rows.map(r => `${r.column_name} (${r.data_type})`).join(', ')
                        tables.push(`Table '${row.table_name}': ${columns}`)
                    }
                    schemaSummary = tables.join('\n')
                }
            } finally {
                await client.end()
            }
        }

        // 3. Ask AI for Suggestions
        const systemPrompt = `
            You are an expert Data Analyst.
            Based on the provided database schema, suggest 3-5 interesting analytical questions that a business user might want to ask.
            
            Schema:
            ${schemaSummary}
            
            Rules:
            1. Return ONLY a JSON array of strings. Example: ["Question 1", "Question 2"]
            2. Focus on aggregations, trends, and top/bottom lists.
            3. Keep questions concise and natural.
        `

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Suggest analysis questions." }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        const suggestions = content ? JSON.parse(content).questions || JSON.parse(content) : []

        // Handle case where API returns object with key 'questions' instead of direct array
        const finalSuggestions = Array.isArray(suggestions) ? suggestions : (suggestions.questions || [])

        return NextResponse.json({ suggestions: finalSuggestions })

    } catch (error) {
        console.error('Suggestion error:', error)
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }
}
