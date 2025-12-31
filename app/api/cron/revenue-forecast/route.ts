import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ForecastingAgent } from "@/lib/agents/forecasting-agent";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

/**
 * Revenue Forecast Cron Job
 * Schedule: Weekly on Monday at 6:00 AM
 * Purpose: Generate 30-day revenue projections
 */
async function handleCronJob(req: Request) {
    try {
        // Verify cron secret
        const authHeader = (await headers()).get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] Revenue Forecast Job Started");
        const startTime = Date.now();

        // Get the primary dataset
        const dataset = await prisma.dataset.findFirst({
            where: {
                status: { in: ["READY", "CLEANED"] },
                rawFileLocation: { not: "" }
            },
            include: {
                profile: true
            },
            orderBy: { uploadedAt: 'desc' }
        });

        if (!dataset || !dataset.profile) {
            return NextResponse.json({
                success: true,
                message: "No dataset available for forecasting"
            });
        }

        const forecaster = new ForecastingAgent();
        const duckdb = new DuckDBEngine();

        try {
            const filePath = getLocalFilePath(dataset.rawFileLocation);

            // Get historical revenue data (last 90 days, grouped by day)
            const revenueQuery = `
                SELECT 
                    CAST(created_at AS DATE) as date,
                    SUM(CAST(amount AS DOUBLE)) as revenue,
                    COUNT(*) as order_count
                FROM {{readFunction}}
                WHERE _type = 'order' 
                    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
                GROUP BY date
                ORDER BY date ASC
            `;

            const historicalData = await duckdb.query(filePath, revenueQuery);
            duckdb.close();

            if (historicalData.length < 6) {
                console.log("[Cron] Insufficient historical data for forecasting");
                return NextResponse.json({
                    success: true,
                    message: "Insufficient data (need at least 6 data points)",
                    forecast: null
                });
            }

            // Generate forecast
            const forecastResult = await forecaster.forecast(
                "Forecast revenue for the next 30 days",
                historicalData.map(d => ({
                    date: d.date,
                    revenue: Number(d.revenue),
                    order_count: Number(d.order_count)
                })),
                { intent: "forecast", metrics: ["revenue"], time_dimension: "date" }
            );

            // Parse the forecast result (assuming it returns JSON)
            let forecast: any = {};
            try {
                forecast = JSON.parse(forecastResult);
            } catch {
                // If not JSON, create a structured response
                forecast = {
                    forecast_periods: [],
                    trend_direction: "stable",
                    growth_rate: "0%",
                    confidence_level: "medium",
                    assumptions: forecastResult,
                    business_recommendation: "Continue monitoring trends."
                };
            }

            // Calculate summary metrics
            const totalHistoricalRevenue = historicalData.reduce((sum, d) => sum + Number(d.revenue), 0);
            const avgDailyRevenue = totalHistoricalRevenue / historicalData.length;
            const projectedRevenue = forecast.forecast_periods?.reduce((sum: number, p: any) => sum + (p.predicted_value || 0), 0) || (avgDailyRevenue * 30);

            // Store forecast in DailyBriefing table
            await prisma.dailyBriefing.create({
                data: {
                    datasetId: dataset.id,
                    briefingDate: new Date(),
                    executiveSummary: `Revenue Forecast: ${forecast.trend_direction} trend detected. Projected revenue for next 30 days: $${Math.round(projectedRevenue).toLocaleString()}`,
                    keyMetrics: {
                        projected_revenue_30d: Math.round(projectedRevenue),
                        avg_daily_revenue: Math.round(avgDailyRevenue),
                        growth_rate: forecast.growth_rate,
                        confidence: forecast.confidence_level
                    } as any,
                    anomalies: forecast.business_recommendation || "",
                    rawData: {
                        forecast_periods: forecast.forecast_periods,
                        historical_data: historicalData.slice(-30) // Last 30 days
                    } as any,
                    generatedAt: new Date()
                }
            });

            // Update dataset with forecast summary
            await prisma.dataset.update({
                where: { id: dataset.id },
                data: {
                    lastForecastAt: new Date(),
                    forecastSummary: {
                        projected_revenue: Math.round(projectedRevenue),
                        growth_rate: forecast.growth_rate,
                        confidence: forecast.confidence_level,
                        trend: forecast.trend_direction
                    } as any
                }
            });

            const duration = Date.now() - startTime;
            console.log(`[Cron] Revenue Forecast Job Completed in ${duration}ms`);

            return NextResponse.json({
                success: true,
                message: "Revenue forecast generated",
                forecast: {
                    projected_revenue_30d: Math.round(projectedRevenue),
                    trend: forecast.trend_direction,
                    confidence: forecast.confidence_level,
                    duration_ms: duration
                }
            });

        } catch (error: any) {
            duckdb.close();
            throw error;
        }

    } catch (error: any) {
        console.error("[Cron] Revenue Forecast Job Failed:", error);
        return NextResponse.json(
            { error: "Job failed", details: error.message },
            { status: 500 }
        );
    }
}

// Export both GET and POST methods
export const GET = handleCronJob;
export const POST = handleCronJob;
