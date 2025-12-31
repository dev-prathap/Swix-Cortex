import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Client } from 'pg'

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

// GET - Get specific data source
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const dataSource = await prisma.dataSource.findUnique({
            where: { id, userId }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        return NextResponse.json(dataSource)
    } catch (error) {
        console.error('Get data source error:', error)
        return NextResponse.json({ error: 'Failed to fetch data source' }, { status: 500 })
    }
}

// PUT - Update data source
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const { name, connectionDetails } = body

        // Verify ownership
        const existingDataSource = await prisma.dataSource.findUnique({
            where: { id, userId }
        })

        if (!existingDataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // Update the data source
        const updatedDataSource = await prisma.dataSource.update({
            where: { id },
            data: {
                name: name || existingDataSource.name,
                connectionDetails: connectionDetails ? JSON.stringify(connectionDetails) : existingDataSource.connectionDetails
            }
        })

        return NextResponse.json(updatedDataSource)
    } catch (error) {
        console.error('Update data source error:', error)
        return NextResponse.json({ error: 'Failed to update data source' }, { status: 500 })
    }
}

// DELETE - Delete data source
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params

        // Get data source details before deletion
        const dataSource = await prisma.dataSource.findUnique({
            where: { id, userId }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // Delete associated datasets (matching by name pattern for now since direct link is missing)
        const associatedDatasets = await prisma.dataset.findMany({
            where: {
                userId,
                name: { startsWith: dataSource.name }
            }
        })

        for (const dataset of associatedDatasets) {
            // Clean up files if they exist
            try {
                const storagePath = process.env.LOCAL_STORAGE_PATH || "./data/uploads"
                const filePath = `${storagePath}/${dataset.rawFileLocation}`
                const fs = require('fs')
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }
            } catch (e) {
                console.warn('Failed to delete dataset file:', e)
            }

            // Delete related records first (cascade delete all foreign keys)
            await prisma.query.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.analysis.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.semanticMapping.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.cleaningPlan.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.dataProfile.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.customerProfile.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.productInsight.deleteMany({
                where: { datasetId: dataset.id }
            })
            await prisma.dailyBriefing.deleteMany({
                where: { datasetId: dataset.id }
            })

            // Now safe to delete dataset
            await prisma.dataset.delete({
                where: { id: dataset.id }
            })
        }

        // If it's an ingested CSV or DB, drop the database table
        if (dataSource.type === 'POSTGRES' || dataSource.type === 'MYSQL') {
            try {
                const connectionDetails = JSON.parse(dataSource.connectionDetails)
                if (connectionDetails.isIngested && connectionDetails.tableName) {
                    const client = new Client({ connectionString: process.env.DATABASE_URL })
                    await client.connect()

                    try {
                        await client.query(`DROP TABLE IF EXISTS "${connectionDetails.tableName}"`)
                        console.log(`Dropped table: ${connectionDetails.tableName}`)
                    } catch (dbError) {
                        console.warn('Failed to drop table:', dbError)
                    } finally {
                        await client.end()
                    }
                }
            } catch (parseError) {
                console.warn('Failed to parse connection details for cleanup:', parseError)
            }
        }

        // Delete the data source record
        await prisma.dataSource.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Data source and associated data deleted successfully',
            deletedId: id
        })
    } catch (error) {
        console.error('Delete data source error:', error)
        return NextResponse.json({ error: 'Failed to delete data source' }, { status: 500 })
    }
}
