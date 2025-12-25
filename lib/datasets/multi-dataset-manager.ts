import prisma from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build'
})

export class MultiDatasetManager {
    async detectRelationships(dataset1Id: string, dataset2Id: string): Promise<any> {
        const [dataset1, dataset2] = await Promise.all([
            prisma.dataset.findUnique({
                where: { id: dataset1Id },
                include: { profile: true }
            }),
            prisma.dataset.findUnique({
                where: { id: dataset2Id },
                include: { profile: true }
            })
        ])

        if (!dataset1 || !dataset2 || !dataset1.profile || !dataset2.profile) {
            throw new Error('Datasets not profiled')
        }

        // Use AI to detect potential join keys
        const prompt = `Dataset 1 (${dataset1.name}):
Domain: ${dataset1.profile.domain}
Entity: ${dataset1.profile.mainEntity}
Dimensions: ${JSON.stringify(dataset1.profile.dimensions)}
Metrics: ${JSON.stringify(dataset1.profile.metrics)}

Dataset 2 (${dataset2.name}):
Domain: ${dataset2.profile.domain}
Entity: ${dataset2.profile.mainEntity}
Dimensions: ${JSON.stringify(dataset2.profile.dimensions)}
Metrics: ${JSON.stringify(dataset2.profile.metrics)}

Identify potential join keys between these datasets.
Consider:
- Similar column names
- Same data types
- Logical relationships (e.g., customer_id, order_id)

Return JSON with potential relationships:
{
  "relationships": [
    {
      "join_key_1": "column_in_dataset_1",
      "join_key_2": "column_in_dataset_2",
      "relationship_type": "ONE_TO_ONE|ONE_TO_MANY|MANY_TO_MANY",
      "confidence": 0.0-1.0,
      "reasoning": "explanation"
    }
  ]
}`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'You are a database expert identifying relationships between datasets.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')

        // Store detected relationships
        const relationships = []
        for (const rel of (result.relationships || [])) {
            const relationship = await prisma.datasetRelationship.create({
                data: {
                    dataset1Id,
                    dataset2Id,
                    joinKey1: rel.join_key_1,
                    joinKey2: rel.join_key_2,
                    relationshipType: rel.relationship_type,
                    confidence: rel.confidence,
                    userConfirmed: false
                }
            })
            relationships.push({ ...relationship, reasoning: rel.reasoning })
        }

        return relationships
    }

    async getRelationships(datasetId: string): Promise<any[]> {
        const relationships = await prisma.datasetRelationship.findMany({
            where: {
                OR: [
                    { dataset1Id: datasetId },
                    { dataset2Id: datasetId }
                ]
            },
            include: {
                dataset1: {
                    select: { id: true, name: true }
                },
                dataset2: {
                    select: { id: true, name: true }
                }
            }
        })

        return relationships
    }

    async confirmRelationship(relationshipId: string): Promise<void> {
        await prisma.datasetRelationship.update({
            where: { id: relationshipId },
            data: { userConfirmed: true }
        })
    }
}

