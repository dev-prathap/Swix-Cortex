import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Start seeding...')

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log(`Created user with id: ${user.id}`)

    // Clean up existing data to avoid duplicates
    await prisma.dataSource.deleteMany({ where: { userId: user.id } })
    await prisma.report.deleteMany({ where: { userId: user.id } })
    await prisma.salesData.deleteMany({})

    // Create Sales Data
    await prisma.salesData.createMany({
        data: [
            { region: 'North America', product: 'Widget A', salesAmount: 1500.00, saleDate: new Date('2024-01-15'), quantity: 100 },
            { region: 'North America', product: 'Widget B', salesAmount: 2500.00, saleDate: new Date('2024-01-16'), quantity: 50 },
            { region: 'Europe', product: 'Widget A', salesAmount: 1200.00, saleDate: new Date('2024-01-17'), quantity: 80 },
            { region: 'Europe', product: 'Widget C', salesAmount: 3000.00, saleDate: new Date('2024-01-18'), quantity: 30 },
            { region: 'Asia Pacific', product: 'Widget B', salesAmount: 4000.00, saleDate: new Date('2024-01-19'), quantity: 80 },
            { region: 'Asia Pacific', product: 'Widget A', salesAmount: 2000.00, saleDate: new Date('2024-01-20'), quantity: 130 },
            { region: 'Latin America', product: 'Widget C', salesAmount: 1000.00, saleDate: new Date('2024-01-21'), quantity: 10 },
            { region: 'North America', product: 'Widget A', salesAmount: 1800.00, saleDate: new Date('2024-02-01'), quantity: 120 },
            { region: 'Europe', product: 'Widget B', salesAmount: 2200.00, saleDate: new Date('2024-02-02'), quantity: 44 },
        ]
    })
    console.log('Seeded Sales Data')

    // Create some data sources
    // We use the local database URL for the "Production DB" simulation
    const postgresSource = await prisma.dataSource.create({
        data: {
            name: 'Production DB',
            type: 'POSTGRES',
            connectionDetails: JSON.stringify({ connectionString: process.env.DATABASE_URL }),
            userId: user.id,
        },
    })

    const csvSource = await prisma.dataSource.create({
        data: {
            name: 'Q3 Sales Data',
            type: 'CSV',
            connectionDetails: JSON.stringify({ file: 'sales_q3.csv' }),
            userId: user.id,
        },
    })

    console.log(`Created data sources: ${postgresSource.name}, ${csvSource.name}`)

    // Create some reports
    await prisma.report.create({
        data: {
            title: 'Monthly Sales Overview',
            description: 'Analysis of sales performance for the current month.',
            visualizations: JSON.stringify({ type: 'bar', data: [10, 20, 30] }),
            userId: user.id,
        },
    })

    await prisma.report.create({
        data: {
            title: 'User Retention Analysis',
            description: 'Cohort analysis of user retention rates.',
            visualizations: JSON.stringify({ type: 'line', data: [100, 80, 60, 50] }),
            userId: user.id,
        },
    })

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
