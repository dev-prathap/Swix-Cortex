import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
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

// GET /api/analyst/datasets/[id]/versions - Get version history
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

        const versionManager = new VersionManager()
        const versions = await versionManager.getVersionHistory(id)

        return NextResponse.json({ versions })
    } catch (error) {
        console.error('Failed to fetch versions:', error)
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }
}

// POST /api/analyst/datasets/[id]/versions/rollback - Rollback to version
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const { targetVersion } = await req.json()

        if (typeof targetVersion !== 'number') {
            return NextResponse.json({ error: 'Invalid targetVersion' }, { status: 400 })
        }

        const dataset = await prisma.dataset.findUnique({
            where: { id, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        const versionManager = new VersionManager()
        await versionManager.rollback(id, targetVersion)

        return NextResponse.json({
            success: true,
            message: `Rolled back to version ${targetVersion}`
        })
    } catch (error) {
        console.error('Failed to rollback:', error)
        return NextResponse.json({
            error: 'Failed to rollback',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

