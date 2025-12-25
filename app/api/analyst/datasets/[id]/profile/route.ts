import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ProfilingAgent } from '@/lib/agents/profiling-agent'

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

// POST /api/analyst/datasets/[id]/profile - Trigger profiling
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        
        // Verify dataset belongs to user
        const dataset = await prisma.dataset.findUnique({
            where: { id, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        // Update status to PROFILING
        await prisma.dataset.update({
            where: { id },
            data: { status: 'PROFILING' }
        })

        // Run profiling agent
        const profilingAgent = new ProfilingAgent()
        const profile = await profilingAgent.profileDataset(id)

        return NextResponse.json({ 
            success: true,
            profile,
            message: 'Dataset profiled successfully'
        })
    } catch (error) {
        console.error('Profiling failed:', error)
        
        // Update status to ERROR
        const { id } = await params
        await prisma.dataset.update({
            where: { id },
            data: { status: 'ERROR' }
        }).catch(() => {})

        return NextResponse.json({ 
            error: 'Failed to profile dataset',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET /api/analyst/datasets/[id]/profile - Get existing profile
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        
        const dataset = await prisma.dataset.findUnique({
            where: { id, userId },
            include: { profile: true }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        if (!dataset.profile) {
            return NextResponse.json({ error: 'Profile not yet generated' }, { status: 404 })
        }

        return NextResponse.json({ profile: dataset.profile })
    } catch (error) {
        console.error('Failed to fetch profile:', error)
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
}

