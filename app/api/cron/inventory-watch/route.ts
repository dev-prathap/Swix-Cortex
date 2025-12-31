import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { AnomalyAgent } from "@/lib/agents/anomaly-agent";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

/**
 * Inventory Watch Cron Job
 * Schedule: Every 6 hours
 * Purpose: Monitor stock levels and predict stockouts
 */
async function handleCronJob(req: Request) {
    try {
        // Verify cron secret
        const authHeader = (await headers()).get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] Inventory Watch Job Started");
        const startTime = Date.now();

        // Get datasets with product data
        const datasets = await prisma.dataset.findMany({
            where: {
                status: { in: ["READY", "CLEANED"] },
                rawFileLocation: { not: "" }
            },
            include: {
                profile: true
            }
        });

        if (datasets.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No datasets to monitor"
            });
        }

        const anomalyAgent = new AnomalyAgent();
        const duckdb = new DuckDBEngine();
        let totalInsights = 0;
        const criticalAlerts: any[] = [];

        for (const dataset of datasets) {
            try {
                const filePath = getLocalFilePath(dataset.rawFileLocation);

                // Query for product inventory data
                const inventoryQuery = `
                    SELECT 
                        name as product_name,
                        sku,
                        CAST(stock AS INTEGER) as current_stock,
                        CAST(price AS DOUBLE) as price,
                        COUNT(*) OVER (PARTITION BY name) as order_frequency
                    FROM {{readFunction}}
                    WHERE _type = 'product' AND stock IS NOT NULL
                    ORDER BY CAST(stock AS INTEGER) ASC
                    LIMIT 50
                `;

                const products = await duckdb.query(filePath, inventoryQuery);

                if (products.length === 0) continue;

                // Analyze inventory levels
                const lowStockProducts = products.filter(p => Number(p.current_stock) < 20);

                for (const product of lowStockProducts) {
                    const stockLevel = Number(product.current_stock);
                    const orderFreq = Number(product.order_frequency) || 1;

                    // Simple stockout prediction: days_until_stockout = current_stock / daily_velocity
                    const dailyVelocity = Math.max(1, orderFreq / 30); // Rough estimate
                    const daysUntilStockout = Math.floor(stockLevel / dailyVelocity);

                    const insight = {
                        product_name: product.product_name,
                        sku: product.sku,
                        current_stock: stockLevel,
                        predicted_stockout_days: daysUntilStockout,
                        risk_level: daysUntilStockout < 3 ? 'critical' : daysUntilStockout < 7 ? 'high' : 'medium',
                        recommendation: daysUntilStockout < 3
                            ? 'URGENT: Reorder immediately'
                            : `Reorder within ${daysUntilStockout} days`
                    };

                    // Store in ProductInsight table
                    await prisma.productInsight.upsert({
                        where: {
                            datasetId_productSku: {
                                datasetId: dataset.id,
                                productSku: product.sku || product.product_name
                            }
                        },
                        update: {
                            productName: product.product_name,
                            currentStock: stockLevel,
                            predictedStockoutDays: daysUntilStockout,
                            riskLevel: insight.risk_level,
                            recommendation: insight.recommendation,
                            lastCheckedAt: new Date()
                        },
                        create: {
                            datasetId: dataset.id,
                            productSku: product.sku || product.product_name,
                            productName: product.product_name,
                            currentStock: stockLevel,
                            predictedStockoutDays: daysUntilStockout,
                            riskLevel: insight.risk_level,
                            recommendation: insight.recommendation
                        }
                    });

                    totalInsights++;

                    if (insight.risk_level === 'critical') {
                        criticalAlerts.push(insight);
                    }
                }

                // Update dataset insight feed with critical alerts
                if (criticalAlerts.length > 0) {
                    const existingInsights = (dataset.insightFeed as any[]) || [];
                    const newInsights = criticalAlerts.slice(0, 3).map(alert => ({
                        type: 'inventory_alert',
                        title: `Low Stock: ${alert.product_name}`,
                        content: `Only ${alert.current_stock} units left. ${alert.recommendation}`,
                        severity: 'high',
                        timestamp: new Date().toISOString()
                    }));

                    await prisma.dataset.update({
                        where: { id: dataset.id },
                        data: {
                            insightFeed: [...newInsights, ...existingInsights.slice(0, 5)] as any
                        }
                    });
                }

            } catch (error: any) {
                console.error(`[Cron] Error processing dataset ${dataset.name}:`, error);
            }
        }

        duckdb.close();

        const duration = Date.now() - startTime;
        console.log(`[Cron] Inventory Watch Job Completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: "Inventory monitoring completed",
            stats: {
                insights_generated: totalInsights,
                critical_alerts: criticalAlerts.length,
                duration_ms: duration
            },
            critical_alerts: criticalAlerts.slice(0, 5)
        });

    } catch (error: any) {
        console.error("[Cron] Inventory Watch Job Failed:", error);
        return NextResponse.json(
            { error: "Job failed", details: error.message },
            { status: 500 }
        );
    }
}

// Export both GET and POST methods
export const GET = handleCronJob;
export const POST = handleCronJob;
