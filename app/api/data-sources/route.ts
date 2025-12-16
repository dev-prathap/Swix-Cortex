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
        const dataSources = await prisma.dataSource.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(dataSources)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, type, connectionDetails } = body

        if (!name || !type || !connectionDetails) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // In a real app, we would validate the connection here
        // For now, we'll just save it

        const dataSource = await prisma.dataSource.create({
            data: {
                name,
                type,
                connectionDetails: JSON.stringify(connectionDetails), // Encrypt this in production
                userId,
                status: 'ACTIVE'
            }
        })

        return NextResponse.json(dataSource, { status: 201 })
    } catch (error) {
        console.error('Create data source error:', error)
        return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 })
    }
}
