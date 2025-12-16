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
        const [dataSourceCount, queryCount, reportCount] = await Promise.all([
            prisma.dataSource.count({ where: { userId } }),
            prisma.queryHistory.count({ where: { userId } }),
            prisma.report.count({ where: { userId } }),
        ])

        return NextResponse.json({
            dataSources: dataSourceCount,
            queries: queryCount,
            reports: reportCount,
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
