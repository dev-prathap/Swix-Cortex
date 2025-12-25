import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { ObjectStorage } from '@/lib/storage/object-storage'
import Papa from 'papaparse'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build'
})

const objectStorage = new ObjectStorage()

const ANALYSIS_SYSTEM_PROMPT = `You are a senior business data analyst consultant.

Your role is to analyze data and provide actionable insights like a human consultant would.

Analyze the data and provide:
1. Executive summary (2-3 sentences)
2. Key insights with categories (growth/risk/opportunity/anomaly)
3. Supporting data for each insight
4. Confidence scores
5. Recommendations

Think like a consultant:
- Focus on business impact
- Highlight trends and patterns
- Identify risks and opportunities
- Be specific with numbers
- Explain causation when possible

Return valid JSON with structure:
{
  "summary": "Brief executive summary...",
  "insights": [
    {
      "category": "growth|risk|opportunity|anomaly",
      "text": "Insight description with specific numbers",
      "confidence": 0.0-1.0,
      "supporting_data": {}
    }
  ],
  "recommendations": ["Actionable recommendation 1", ...]
}`

export class AnalysisAgent {
    async analyzeDataset(datasetId: string, analysisType: 'SUMMARY' | 'TREND' | 'COMPARISON' | 'ANOMALY' = 'SUMMARY'): Promise<any> {
        // Get dataset with profile
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: {
                profile: true,
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                },
                semanticMappings: true
            }
        })

        if (!dataset || !dataset.profile) {
            throw new Error('Dataset profile not found')
        }

        const profile = dataset.profile
        const latestVersion = dataset.versions[0]

        // Download and parse data sample
        const fileStream = await objectStorage.downloadRaw(latestVersion.fileLocation)
        const chunks: Buffer[] = []
        for await (const chunk of fileStream) {
            chunks.push(chunk as Buffer)
        }
        const fileContent = Buffer.concat(chunks).toString('utf-8')

        const parsed = Papa.parse(fileContent, {
            header: true,
            preview: 100 // Only parse first 100 rows for analysis
        })

        const sampleData = parsed.data

        // Build analysis prompt
        const prompt = `Dataset: ${dataset.name}
Domain: ${profile.domain}
Main Entity: ${profile.mainEntity}

Metrics: ${JSON.stringify(profile.metrics)}
Dimensions: ${JSON.stringify(profile.dimensions)}
Time Column: ${profile.timeColumn || 'none'}

Data Quality Score: ${profile.dataQualityScore}
Known Issues: ${JSON.stringify(profile.issues)}

Sample Data (first 10 rows):
${JSON.stringify(sampleData.slice(0, 10), null, 2)}

Analysis Type: ${analysisType}

Please provide a comprehensive business analysis with actionable insights.`

        // Call OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.4
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')

        // Store analysis
        const analysis = await prisma.analysis.create({
            data: {
                datasetId,
                type: analysisType,
                title: `${analysisType} Analysis - ${dataset.name}`,
                summary: result.summary || 'Analysis completed',
                insights: result.insights || [],
                visualizations: result.visualizations || [],
                confidence: this.calculateAverageConfidence(result.insights || [])
            }
        })

        // Update dataset status
        await prisma.dataset.update({
            where: { id: datasetId },
            data: { status: 'ANALYZED' }
        })

        return {
            analysis,
            recommendations: result.recommendations || []
        }
    }

    private calculateAverageConfidence(insights: any[]): number {
        if (insights.length === 0) return 0.5
        const sum = insights.reduce((acc, i) => acc + (i.confidence || 0.5), 0)
        return sum / insights.length
    }

    async getAnalyses(datasetId: string): Promise<any[]> {
        return await prisma.analysis.findMany({
            where: { datasetId },
            orderBy: { generatedAt: 'desc' }
        })
    }
}

