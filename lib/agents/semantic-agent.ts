import prisma from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build'
})

const SEMANTIC_SYSTEM_PROMPT = `You are an expert at mapping data columns to business concepts.

Analyze the provided column names and sample data to identify semantic business concepts.

Common concepts to look for:
- revenue (sales, amount, total, price, value)
- cost (expense, spend, charges)
- profit (margin, earnings)
- date (time, timestamp, created_at, order_date)
- location (city, region, state, country, address)
- customer (client, user, buyer, account)
- product (item, sku, service)
- quantity (count, volume, units)
- category (type, segment, class)

Return a JSON object mapping concepts to columns with confidence scores.

Example output:
{
  "mappings": {
    "revenue": {
      "columns": ["amount", "order_total"],
      "confidence": 0.92
    },
    "date": {
      "columns": ["order_date", "created_at"],
      "confidence": 0.95
    }
  }
}`

export class SemanticAgent {
    async mapSemanticConcepts(datasetId: string): Promise<any> {
        // Get dataset profile
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: { profile: true }
        })

        if (!dataset || !dataset.profile) {
            throw new Error('Dataset profile not found. Please run profiling first.')
        }

        const profile = dataset.profile

        // Build prompt with profile data
        const prompt = `Dataset Domain: ${profile.domain}
Main Entity: ${profile.mainEntity}

Metrics: ${JSON.stringify(profile.metrics)}
Dimensions: ${JSON.stringify(profile.dimensions)}
Time Column: ${profile.timeColumn || 'none'}

Identify semantic business concepts and map them to these columns.
Consider the domain context when making mappings.`

        // Call OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SEMANTIC_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')
        const mappings = result.mappings || {}

        // Store mappings in database
        const semanticMappings = []
        for (const [concept, data] of Object.entries(mappings) as any) {
            const mapping = await prisma.semanticMapping.create({
                data: {
                    datasetId,
                    concept,
                    mappedColumns: data.columns,
                    confidence: data.confidence,
                    userConfirmed: false
                }
            })
            semanticMappings.push(mapping)
        }

        return {
            mappings: semanticMappings,
            rawResult: result
        }
    }

    async resolveConcept(datasetId: string, concept: string): Promise<string[]> {
        // Get semantic mappings for concept
        const mappings = await prisma.semanticMapping.findMany({
            where: {
                datasetId,
                concept: {
                    contains: concept,
                    mode: 'insensitive'
                }
            },
            orderBy: { confidence: 'desc' }
        })

        if (mappings.length === 0) {
            return []
        }

        return mappings[0].mappedColumns as string[]
    }
}

