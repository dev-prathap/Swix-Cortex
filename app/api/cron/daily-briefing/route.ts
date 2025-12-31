import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AnalystAgent } from "@/lib/agents/analyst-agent";
import { ExecutiveAgent } from "@/lib/agents/executive-agent";
import { AnomalyAgent } from "@/lib/agents/anomaly-agent";
import { getLocalFilePath } from "@/lib/data/duckdb-engine";

/**
 * Daily Briefing Cron Job
 * Schedule: Daily at 8:00 AM
 * Purpose: Generate executive summary of yesterday's business performance
 */
async function handleCronJob(req: Request) {
    try {
        console.log("[Cron] Daily Briefing Job Started");
        const startTime = Date.now();

        // Get the most recent dataset (assuming it's the primary business data)
        const dataset = await prisma.dataset.findFirst({
            where: {
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" }
            },
            include: {
                profile: true
            },
            orderBy: { uploadedAt: 'desc' }
        });

        if (!dataset) {
            console.log("[Cron] No suitable dataset found for briefing");
            return NextResponse.json({
                success: true,
                message: "No dataset available",
                briefing: null
            });
        }

        // Auto-profile if not profiled yet
        if (!dataset.profile) {
            console.log("[Cron] Dataset not profiled, running profiling...");
            const { ProfilingAgent } = await import('@/lib/agents/profiling-agent');
            const profilingAgent = new ProfilingAgent();
            try {
                const profile = await profilingAgent.profileDataset(dataset.id);
                dataset.profile = profile;
            } catch (error) {
                console.error("[Cron] Profiling failed:", error);
                return NextResponse.json({
                    success: false,
                    message: "Dataset profiling failed",
                    briefing: null
                });
            }
        }

        const filePath = getLocalFilePath(dataset.rawFileLocation);
        const metricMap: Record<string, string> = {};

        // Import DuckDB for direct queries
        const { DuckDBEngine } = await import('@/lib/data/duckdb-engine');
        const duckdb = new DuckDBEngine();

        // 1. Get REAL yesterday metrics with SQL
        const yesterdayMetricsQuery = `
            WITH yesterday AS (
                SELECT 
                    COUNT(*) as order_count,
                    SUM(CAST(total_price AS DOUBLE)) as revenue,
                    COUNT(DISTINCT customer_id) as customers
                FROM {{readFunction}}
                WHERE _type = 'order'
                    AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
            ),
            day_before AS (
                SELECT 
                    COUNT(*) as order_count,
                    SUM(CAST(total_price AS DOUBLE)) as revenue
                FROM {{readFunction}}
                WHERE _type = 'order'
                    AND DATE(created_at) = CURRENT_DATE - INTERVAL '2 days'
            )
            SELECT 
                y.order_count,
                y.revenue,
                y.customers,
                d.order_count as prev_orders,
                d.revenue as prev_revenue,
                CASE 
                    WHEN d.revenue > 0 THEN ((y.revenue - d.revenue) / d.revenue * 100)
                    ELSE 0 
                END as revenue_change_pct,
                CASE 
                    WHEN d.order_count > 0 THEN ((y.order_count - d.order_count) / d.order_count * 100)
                    ELSE 0 
                END as orders_change_pct
            FROM yesterday y, day_before d
        `;

        let keyMetrics = {
            total_revenue: 0,
            total_orders: 0,
            total_customers: 0,
            revenue_change_pct: 0,
            orders_change_pct: 0
        };

        let briefData: any[] = [];

        try {
            briefData = await duckdb.query(filePath, yesterdayMetricsQuery);
            
            if (briefData.length > 0) {
                const row = briefData[0];
                keyMetrics = {
                    total_revenue: Number(row.revenue) || 0,
                    total_orders: Number(row.order_count) || 0,
                    total_customers: Number(row.customers) || 0,
                    revenue_change_pct: Number(row.revenue_change_pct) || 0,
                    orders_change_pct: Number(row.orders_change_pct) || 0
                };
            }
        } catch (error) {
            console.error("[Cron] Failed to fetch yesterday's metrics:", error);
        } finally {
            duckdb.close();
        }

        // 2. Generate SHORT executive summary (2 lines max)
        let executiveSummary = "";
        
        if (keyMetrics.total_orders === 0) {
            // No data for yesterday
            executiveSummary = "No transactions recorded for yesterday. Business was closed or no sales activity detected.";
        } else {
            // Generate AI summary for actual data
            const executive = new ExecutiveAgent();
            const summaryPrompt = `Yesterday: ${keyMetrics.total_orders} orders, $${keyMetrics.total_revenue.toFixed(2)} revenue. Revenue ${keyMetrics.revenue_change_pct > 0 ? 'up' : 'down'} ${Math.abs(keyMetrics.revenue_change_pct).toFixed(1)}% vs day before.`;
            
            const executiveSummaryResult = await executive.synthesize(
                "Write a 2-sentence executive briefing about yesterday's performance",
                briefData,
                summaryPrompt,
                []
            ) as any;

            executiveSummary = typeof executiveSummaryResult === 'string' 
                ? executiveSummaryResult 
                : executiveSummaryResult?.summary || executiveSummaryResult?.content || "No executive summary available.";
        }

        // 3. Quick anomaly check
        let anomalies = "No significant anomalies detected.";
        if (Math.abs(keyMetrics.revenue_change_pct) > 50) {
            anomalies = `Alert: Revenue changed by ${keyMetrics.revenue_change_pct.toFixed(1)}% - significant deviation from previous day.`;
        }

        // 5. Store the briefing
        const briefing = await prisma.dailyBriefing.create({
            data: {
                datasetId: dataset.id,
                briefingDate: new Date(),
                executiveSummary,
                keyMetrics: keyMetrics as any,
                anomalies,
                rawData: briefData as any,
                generatedAt: new Date()
            }
        });

        // 6. Update dataset's insight feed
        const insightFeed = [
            {
                type: 'daily_summary',
                title: 'Daily Performance',
                content: executiveSummary.split('\n')[0], // First line as summary
                priority: 'high',
                timestamp: new Date().toISOString()
            },
            ...(anomalies !== "No significant anomalies detected." ? [{
                type: 'anomaly_alert',
                title: 'Anomaly Detected',
                content: anomalies.split('\n')[0],
                priority: 'critical',
                timestamp: new Date().toISOString()
            }] : [])
        ];

        await prisma.dataset.update({
            where: { id: dataset.id },
            data: { insightFeed: insightFeed as any }
        });

        const duration = Date.now() - startTime;
        console.log(`[Cron] Daily Briefing Job Completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: "Daily briefing generated",
            briefing: {
                id: briefing.id,
                summary: executiveSummary,
                key_metrics: keyMetrics,
                duration_ms: duration
            }
        });

    } catch (error: any) {
        console.error("[Cron] Daily Briefing Job Failed:", error);
        return NextResponse.json(
            { error: "Job failed", details: error.message },
            { status: 500 }
        );
    }
}

// Export both GET and POST methods
export const GET = handleCronJob;
export const POST = handleCronJob;
