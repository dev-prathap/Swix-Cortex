import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { CleaningAgent } from '@/lib/agents/cleaning-agent'
import { VersionManager } from '@/lib/versioning/version-manager'

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

// POST /api/analyst/datasets/[id]/cleaning - Generate cleaning plan
export async function POST(
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
            return NextResponse.json({ 
                error: 'Profile not found. Please run profiling first.' 
            }, { status: 400 })
        }

        // Generate cleaning plan
        const cleaningAgent = new CleaningAgent()
        const plan = await cleaningAgent.generatePlan(id)

        // Serialize with BigInt support
        const safePlan = JSON.parse(
            JSON.stringify(plan, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        )

        return NextResponse.json({ 
            success: true,
            plan: safePlan,
            message: 'Cleaning plan generated successfully'
        })
    } catch (error) {
        console.error('Cleaning plan generation failed:', error)
        return NextResponse.json({ 
            error: 'Failed to generate cleaning plan',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET /api/analyst/datasets/[id]/cleaning - Get existing cleaning plan
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
            include: {
                cleaningPlans: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        const plan = dataset.cleaningPlans[0]
        if (!plan) {
            return NextResponse.json({ error: 'No cleaning plan found' }, { status: 404 })
        }

        // Serialize with BigInt support
        const safePlan = JSON.parse(
            JSON.stringify(plan, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        )

        return NextResponse.json({ plan: safePlan })
    } catch (error) {
        console.error('Failed to fetch cleaning plan:', error)
        return NextResponse.json({ error: 'Failed to fetch cleaning plan' }, { status: 500 })
    }
}

// PATCH /api/analyst/datasets/[id]/cleaning - Apply cleaning plan
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const { planId, approvedActions } = await req.json()

        const dataset = await prisma.dataset.findUnique({
            where: { id, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        // Find plan by ID or get the latest plan for this dataset
        let plan
        if (planId) {
            plan = await prisma.cleaningPlan.findFirst({
                where: { id: planId, datasetId: id }
            })
        } else {
            // If no planId provided, get the latest plan
            plan = await prisma.cleaningPlan.findFirst({
                where: { datasetId: id },
                orderBy: { createdAt: 'desc' }
            })
        }

        if (!plan) {
            return NextResponse.json({ error: 'Cleaning plan not found' }, { status: 404 })
        }

        // Create new cleaned version
        const versionManager = new VersionManager()
        const newVersion = await versionManager.createVersion({
            datasetId: id,
            type: 'CLEANED',
            cleaningActions: approvedActions || (plan.suggestedActions as any),
            sourceLocation: dataset.rawFileLocation
        })

        // Mark plan as approved (use plan.id, not planId which might be undefined)
        await prisma.cleaningPlan.update({
            where: { id: plan.id },
            data: {
                userApproved: true,
                appliedAt: new Date(),
                resultingVersionId: newVersion.id
            }
        })

        return NextResponse.json({
            success: true,
            version: newVersion,
            message: 'Cleaning applied successfully'
        })
    } catch (error) {
        console.error('Failed to apply cleaning:', error)
        return NextResponse.json({
            error: 'Failed to apply cleaning',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

