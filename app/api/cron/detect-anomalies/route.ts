import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { AnomalyAgent } from "@/lib/agents/anomaly-agent";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

/**
 * Anomaly Detection Cron Job
 * Schedule: Every 3 hours
 * Purpose: Detect unusual patterns in sales, orders, and customer behavior
 */
async function handleCronJob(req: Request) {
    try {
        // Verify cron secret
        const authHeader = (await headers()).get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] Anomaly Detection Job Started");
        const startTime = Date.now();

        // Get active datasets
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
                message: "No datasets to analyze"
            });
        }

        const anomalyAgent = new AnomalyAgent();
        const duckdb = new DuckDBEngine();
        let totalAnomalies = 0;
        const criticalAnomalies: any[] = [];

        for (const dataset of datasets) {
            try {
                const filePath = getLocalFilePath(dataset.rawFileLocation);

                // 1. Check for sales anomalies (last 7 days vs previous 7 days)
                const salesQuery = `
                    SELECT 
                        CAST(created_at AS DATE) as date,
                        SUM(CAST(amount AS DOUBLE)) as daily_revenue,
                        COUNT(*) as daily_orders
                    FROM {{readFunction}}
                    WHERE _type = 'order' 
                        AND created_at >= CURRENT_DATE - INTERVAL '14 days'
                    GROUP BY date
                    ORDER BY date DESC
                `;

                const salesData = await duckdb.query(filePath, salesQuery);

                if (salesData.length >= 7) {
                    const recentWeek = salesData.slice(0, 7);
                    const previousWeek = salesData.slice(7, 14);

                    const recentAvg = recentWeek.reduce((sum, d) => sum + Number(d.daily_revenue), 0) / recentWeek.length;
                    const previousAvg = previousWeek.reduce((sum, d) => sum + Number(d.daily_revenue), 0) / previousWeek.length;

                    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

                    // Flag if change > 30%
                    if (Math.abs(changePercent) > 30) {
                        const anomalyReport = await anomalyAgent.detect(
                            `Analyze this ${changePercent > 0 ? 'spike' : 'drop'} in daily revenue`,
                            salesData,
                            { metric: 'revenue', change_percent: changePercent }
                        );

                        const anomaly = {
                            type: 'revenue_anomaly',
                            severity: Math.abs(changePercent) > 50 ? 'critical' : 'high',
                            title: `Revenue ${changePercent > 0 ? 'Spike' : 'Drop'}: ${Math.abs(changePercent).toFixed(1)}%`,
                            description: anomalyReport.split('\n')[0], // First line
                            detected_at: new Date(),
                            datasetId: dataset.id
                        };

                        criticalAnomalies.push(anomaly);
                        totalAnomalies++;
                    }
                }

                // 2. Check for order volume anomalies
                const orderVolumeQuery = `
                    SELECT 
                        DATE_TRUNC('hour', created_at) as hour,
                        COUNT(*) as order_count
                    FROM {{readFunction}}
                    WHERE _type = 'order' 
                        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
                    GROUP BY hour
                    ORDER BY hour DESC
                `;

                const hourlyOrders = await duckdb.query(filePath, orderVolumeQuery);

                if (hourlyOrders.length > 0) {
                    const avgHourlyOrders = hourlyOrders.reduce((sum, h) => sum + Number(h.order_count), 0) / hourlyOrders.length;
                    const maxHourlyOrders = Math.max(...hourlyOrders.map(h => Number(h.order_count)));

                    // Flag if any hour has 3x the average
                    if (maxHourlyOrders > avgHourlyOrders * 3) {
                        const anomaly = {
                            type: 'order_spike',
                            severity: 'medium',
                            title: 'Unusual Order Volume Spike',
                            description: `Detected ${maxHourlyOrders} orders in a single hour (avg: ${Math.round(avgHourlyOrders)})`,
                            detected_at: new Date(),
                            datasetId: dataset.id
                        };

                        criticalAnomalies.push(anomaly);
                        totalAnomalies++;
                    }
                }

                // 3. Update dataset insight feed
                if (criticalAnomalies.length > 0) {
                    const existingInsights = (dataset.insightFeed as any[]) || [];
                    const newInsights = criticalAnomalies.map(a => ({
                        type: a.type,
                        title: a.title,
                        content: a.description,
                        severity: a.severity,
                        timestamp: new Date().toISOString()
                    }));

                    await prisma.dataset.update({
                        where: { id: dataset.id },
                        data: {
                            insightFeed: [...newInsights, ...existingInsights.slice(0, 5)] as any,
                            lastAnomalyCheckAt: new Date()
                        }
                    });
                }

            } catch (error: any) {
                console.error(`[Cron] Error analyzing dataset ${dataset.name}:`, error);
            }
        }

        duckdb.close();

        const duration = Date.now() - startTime;
        console.log(`[Cron] Anomaly Detection Job Completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: "Anomaly detection completed",
            stats: {
                datasets_analyzed: datasets.length,
                anomalies_detected: totalAnomalies,
                critical_anomalies: criticalAnomalies.filter(a => a.severity === 'critical').length,
                duration_ms: duration
            },
            anomalies: criticalAnomalies.slice(0, 5)
        });

    } catch (error: any) {
        console.error("[Cron] Anomaly Detection Job Failed:", error);
        return NextResponse.json(
            { error: "Job failed", details: error.message },
            { status: 500 }
        );
    }
}

// Export both GET and POST methods
export const GET = handleCronJob;
export const POST = handleCronJob;
