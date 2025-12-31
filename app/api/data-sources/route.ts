import prisma from '@/lib/prisma'
import { getUserId } from '@/lib/auth'
import { safeJsonResponse } from '@/lib/utils/serialization'

export async function GET() {
    const userId = await getUserId()
    if (!userId) return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })

    try {
        const dataSources = await prisma.dataSource.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        return safeJsonResponse(dataSources)
    } catch (error) {
        return safeJsonResponse({ error: 'Failed to fetch data sources' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, type, connectionDetails } = body

        if (!name || !type || !connectionDetails) {
            return safeJsonResponse({ error: 'Missing required fields' }, { status: 400 })
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

        return safeJsonResponse(dataSource, { status: 201 })
    } catch (error) {
        console.error('Create data source error:', error)
        return safeJsonResponse({ error: 'Failed to create data source' }, { status: 500 })
    }
}
