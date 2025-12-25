import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AnalysisAgent } from '@/lib/agents/analysis-agent'
import { SemanticAgent } from '@/lib/agents/semantic-agent'

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

// POST /api/analyst/datasets/[id]/analyze - Run analysis
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const { analysisType } = await req.json()

        const dataset = await prisma.dataset.findUnique({
            where: { id, userId },
            include: { profile: true }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        if (!dataset.profile) {
            return NextResponse.json({
                error: 'Dataset not profiled. Please run profiling first.'
            }, { status: 400 })
        }

        // Generate semantic mappings if not exists
        const existingMappings = await prisma.semanticMapping.findMany({
            where: { datasetId: id }
        })

        if (existingMappings.length === 0) {
            const semanticAgent = new SemanticAgent()
            await semanticAgent.mapSemanticConcepts(id)
        }

        // Run analysis
        const analysisAgent = new AnalysisAgent()
        const result = await analysisAgent.analyzeDataset(
            id,
            analysisType || 'SUMMARY'
        )

        return NextResponse.json({
            success: true,
            analysis: result.analysis,
            recommendations: result.recommendations,
            message: 'Analysis completed successfully'
        })
    } catch (error) {
        console.error('Analysis failed:', error)
        return NextResponse.json({
            error: 'Failed to analyze dataset',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET /api/analyst/datasets/[id]/analyze - Get existing analyses
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params

        const dataset = await prisma.dataset.findUnique({
            where: { id, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        const analysisAgent = new AnalysisAgent()
        const analyses = await analysisAgent.getAnalyses(id)

        return NextResponse.json({ analyses })
    } catch (error) {
        console.error('Failed to fetch analyses:', error)
        return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }
}

