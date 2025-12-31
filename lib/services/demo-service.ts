import prisma from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'
import { DuckDBEngine } from '../data/duckdb-engine'

export class DemoService {
    private storagePath: string

    constructor() {
        this.storagePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data/uploads')
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true })
        }
    }

    async setupDemoData(userId: string) {
        const demoDatasetName = "Demo Store - Swix Cortex"

        // Check if demo dataset already exists for this user
        const existing = await prisma.dataset.findFirst({
            where: {
                userId,
                name: demoDatasetName,
                isDemo: true
            }
        })

        if (existing) {
            console.log(`[DemoService] Demo dataset already exists for user ${userId}, returning existing.`);
            return existing;
        }

        const fileName = `demo_${userId}_${Date.now()}.parquet`
        const filePath = path.join(this.storagePath, fileName)

        // 1. Generate Sample Data
        const sampleData = this.generateSampleData()

        // 2. Save to JSON first (DuckDB can convert JSON to Parquet easily)
        const tempJsonPath = path.join(this.storagePath, `temp_${userId}.json`)
        fs.writeFileSync(tempJsonPath, JSON.stringify(sampleData))

        // 3. Convert to Parquet using DuckDB
        const duckdb = new DuckDBEngine()
        await duckdb.convertJSONToParquet(tempJsonPath, filePath)

        // Cleanup temp JSON
        fs.unlinkSync(tempJsonPath)

        // 4. Create Dataset record in Prisma
        const dataset = await prisma.dataset.create({
            data: {
                userId,
                name: demoDatasetName,
                originalFileName: "demo_data.parquet",
                rawFileLocation: fileName,
                fileSize: BigInt(fs.statSync(filePath).size),
                status: 'READY',
                syncProgress: 100,
                isDemo: true,
                insightFeed: this.generateDemoInsights() as any
            } as any
        })

        return dataset
    }

    private generateSampleData() {
        const products = [
            { name: "Blue Silk Shirt", category: "Apparel", price: 120 },
            { name: "Red Leather Shoes", category: "Footwear", price: 250 },
            { name: "Cotton T-Shirt", category: "Apparel", price: 45 },
            { name: "Denim Jeans", category: "Apparel", price: 85 },
            { name: "Smart Watch V2", category: "Electronics", price: 199 },
            { name: "Wireless Earbuds", category: "Electronics", price: 149 },
            { name: "Leather Wallet", category: "Accessories", price: 55 },
            { name: "Canvas Backpack", category: "Accessories", price: 75 }
        ]

        const data = []
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 90) // 90 days of data

        for (let i = 0; i < 500; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + Math.floor(Math.random() * 90))

            const product = products[Math.floor(Math.random() * products.length)]
            const quantity = Math.floor(Math.random() * 3) + 1
            const amount = product.price * quantity

            data.push({
                order_id: `ORD-${1000 + i}`,
                order_date: date.toISOString().split('T')[0],
                created_at: date.toISOString(), // Added for dashboard compatibility
                customer_name: `Customer ${Math.floor(Math.random() * 100)}`,
                product_name: product.name,
                category: product.category,
                quantity: quantity,
                amount: amount,
                total_price: amount.toString(), // Added for dashboard compatibility
                status: Math.random() > 0.1 ? "Delivered" : "Returned",
                _type: 'order' // Added for dashboard compatibility
            })
        }

        // Add some products too
        products.forEach((p, i) => {
            data.push({
                product_id: `PROD-${i}`,
                product_name: p.name,
                category: p.category,
                price: p.price,
                _type: 'product'
            })
        })

        // Add some customers
        for (let i = 0; i < 20; i++) {
            data.push({
                customer_id: `CUST-${i}`,
                customer_name: `Customer ${i}`,
                _type: 'customer'
            })
        }

        return data
    }

    private generateDemoInsights() {
        return [
            {
                type: "morning_briefing",
                title: "Morning Briefing",
                content: "Good morning! Yesterday's sales were $4,250 (+15% vs last week). Blue Silk Shirt demand increased after 6 PM. ⚠️ Red Leather Shoes stock risk detected.",
                priority: "high",
                timestamp: new Date().toISOString()
            },
            {
                type: "inventory_alert",
                title: "Stock Alert: Red Leather Shoes",
                content: "Red Leather Shoes will be out of stock tomorrow at 2:10 PM based on current velocity. Reorder today to avoid potential loss.",
                priority: "critical",
                action: "Reorder Now",
                timestamp: new Date().toISOString()
            },
            {
                type: "marketing_roi",
                title: "Marketing Insight",
                content: "Your Facebook Ad campaign for 'Apparel' is performing 3x better than 'Electronics'. Consider shifting budget to maximize ROI.",
                priority: "medium",
                action: "Adjust Budget",
                timestamp: new Date().toISOString()
            }
        ]
    }
}
