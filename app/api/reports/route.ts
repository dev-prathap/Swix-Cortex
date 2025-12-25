import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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

export async function GET() {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const reports = await prisma.report.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(reports)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { title, description, visualizations, isPublic, datasetId } = body

        if (!title || !visualizations || !datasetId) {
            return NextResponse.json({ error: 'Missing required fields: title, visualizations, datasetId' }, { status: 400 })
        }

        const report = await prisma.report.create({
            data: {
                title,
                description,
                visualizations: JSON.stringify(visualizations),
                isPublic: isPublic || false,
                userId,
                datasetId
            }
        })

        return NextResponse.json(report, { status: 201 })
    } catch (error) {
        console.error('Create report error:', error)
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }
}
