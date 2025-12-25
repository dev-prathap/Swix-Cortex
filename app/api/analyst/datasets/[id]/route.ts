import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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

// GET /api/analyst/datasets/[id] - Get dataset details
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
                profile: true,
                versions: {
                    orderBy: { versionNumber: 'desc' }
                },
                analyses: {
                    orderBy: { generatedAt: 'desc' }
                },
                semanticMappings: true,
                cleaningPlans: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        // Convert BigInt to string for JSON serialization
        const safeDataset = JSON.parse(
            JSON.stringify(dataset, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        )

        return NextResponse.json({ dataset: safeDataset })
    } catch (error) {
        console.error('Failed to fetch dataset:', error)
        return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 })
    }
}

