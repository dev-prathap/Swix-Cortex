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
                    // Get column information
                    const res = await client.query(`
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                        ORDER BY ordinal_position
                    `, [tableName])

                    // Get sample data to understand actual content
                    const sampleRes = await client.query(`
                        SELECT * FROM "${tableName}" 
                        LIMIT 3
                    `)

                    // Analyze actual data types from samples
                    const columnAnalysis = res.rows.map((col: any) => {
                        const colName = col.column_name
                        const dbType = col.data_type
                        let actualType = dbType
                        let sampleValues: any[] = []

                        // Extract sample values for this column
                        if (sampleRes.rows.length > 0) {
                            sampleValues = sampleRes.rows.map(row => row[colName]).filter(val => val !== null && val !== '')
                        }

                        // Determine actual data type based on content
                        if (sampleValues.length > 0 && dbType === 'text') {
                            const firstVal = String(sampleValues[0]).trim()

                            // Check if it's actually numeric (currency, amounts)
                            if (/^\$?[\d,]+\.?\d*$/.test(firstVal) || !isNaN(Number(firstVal))) {
                                actualType = 'NUMERIC (stored as text)'
                            }
                            // Check if it's actually a date
                            else if (/^\d{4}-\d{2}-\d{2}$/.test(firstVal) ||
                                /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(firstVal) ||
                                /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(firstVal)) {
                                actualType = 'DATE (stored as text)'
                            }
                            // Check if it's categorical (limited unique values)
                            else if (colName.includes('status') || colName.includes('name') || colName.includes('category')) {
                                actualType = 'CATEGORICAL'
                            }
                        }

                        return {
                            name: colName,
                            dbType: dbType,
                            actualType: actualType,
                            samples: sampleValues.slice(0, 2)
                        }
                    })

                    // Build detailed schema context
                    const columnDescriptions = columnAnalysis.map(col => {
                        let desc = `"${col.name}" (${col.actualType})`
                        if (col.samples.length > 0) {
                            desc += ` - Examples: ${col.samples.join(', ')}`
                        }
                        return desc
                    }).join('\n  ')

                    schemaContext = `Table: "${tableName}"
Columns:
  ${columnDescriptions}`
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

            // Enhanced schema context with intelligent data type hints
            const enhancedSchema = schemaContext + `

DATA ANALYSIS CONTEXT:
- This is a general business dataset
- Identify key metrics and dimensions from the schema
- Look for date, numeric, and categorical patterns

SQL GENERATION RULES:
- For NUMERIC columns stored as text: Use CAST("column_name" AS NUMERIC)
- For DATE columns stored as text: Use CAST("column_name" AS DATE) 
- Always use double quotes around table and column names
- Use meaningful aliases for calculated fields
- Include appropriate ORDER BY and LIMIT clauses`

            // Generate comprehensive AI prompt with full schema understanding
            const systemPrompt = `You are an expert PostgreSQL analyst.

DATABASE SCHEMA:
${enhancedSchema}

Your task: Generate precise PostgreSQL queries based on user questions.

CRITICAL REQUIREMENTS:
1. ALWAYS return a valid SQL query - never "ERROR: Cannot answer"
2. Use EXACT table name: "${tableName}"
3. Wrap ALL identifiers in double quotes: "table_name", "column_name"
4. Apply proper type casting based on actual data types shown in schema
5. Include appropriate filters for data quality
6. Use meaningful column aliases
7. Add sensible LIMIT (default 50) unless user specifies otherwise

TYPE CASTING RULES:
- NUMERIC columns stored as text: CAST("column_name" AS NUMERIC)
- DATE columns stored as text: CAST("column_name" AS DATE)
- Always filter out nulls and empty strings for calculations

ALWAYS consider the business context of the dataset when generating queries.`

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                model: "gpt-5.2-2025-12-11",
            })

            let generatedSQL = completion.choices[0].message.content?.trim()

            if (generatedSQL) {
                // Enhanced SQL cleaning and validation
                generatedSQL = generatedSQL
                    .replace(/```sql\n?/g, '') // Remove SQL code blocks
                    .replace(/```/g, '') // Remove any remaining code blocks
                    .replace(/^\s*--.*$/gm, '') // Remove SQL comments
                    .replace(/\n\s*\n/g, '\n') // Remove empty lines
                    .trim()

                // Validate that it starts with a SQL keyword
                const sqlKeywords = ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE']
                const firstWord = generatedSQL.split(/\s+/)[0]?.toUpperCase()

                if (!firstWord || !sqlKeywords.includes(firstWord)) {
                    console.error('Generated content is not valid SQL:', generatedSQL)
                    generatedSQL = undefined // Force fallback
                }

                // Check for common AI text patterns that shouldn't be in SQL
                if (generatedSQL) {
                    const sqlToTest: string = generatedSQL // Type assertion for clarity
                    const invalidPatterns = [
                        /^To\s+/i, // Starts with "To "
                        /^Here\s+/i, // Starts with "Here "
                        /^This\s+query/i, // Starts with "This query"
                        /^The\s+following/i, // Starts with "The following"
                        /^I\s+/i, // Starts with "I "
                        /^You\s+/i // Starts with "You "
                    ]

                    if (invalidPatterns.some(pattern => pattern.test(sqlToTest))) {
                        console.error('Generated content contains explanatory text:', sqlToTest)
                        generatedSQL = undefined // Force fallback
                    }
                }
            }

            if (!generatedSQL || generatedSQL.startsWith("ERROR")) {
                console.error('AI Generation Failed. Schema:', schemaContext)
                console.error('Generated SQL:', generatedSQL)

                // Provide a fallback query for basic data exploration
                const fallbackSQL = `SELECT * FROM "${tableName}" LIMIT 10`
                console.log('Using fallback query:', fallbackSQL)

                await prisma.queryHistory.create({
                    data: {
                        userId,
                        prompt: prompt + ' [FALLBACK]',
                        generatedSQL: fallbackSQL,
                    }
                })

                return NextResponse.json({ sql: fallbackSQL })
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

        } else {
            // Fallback for other types if implemented later
            return NextResponse.json({ error: 'Schema introspection not available for this source type' }, { status: 501 })
        }

        // All AI generation logic is now handled inside the PostgreSQL block above

    } catch (error) {
        console.error('AI Query error:', error)
        return NextResponse.json({ error: 'Failed to generate query' }, { status: 500 })
    }
}
