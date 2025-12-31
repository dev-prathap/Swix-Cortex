import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Dashboard Briefing API
 * Returns the latest AI-generated daily briefing and customer segment summary
 */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const cookieStore = await cookies();
        const isDemoMode = cookieStore.get("swix_demo_mode")?.value === "true";

        const dataset = await prisma.dataset.findFirst({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                isDemo: isDemoMode
            },
            orderBy: { uploadedAt: 'desc' },
            include: {
                dailyBriefings: {
                    orderBy: { generatedAt: 'desc' },
                    take: 1
                }
            }
        } as any) as any;

        if (!dataset) {
            return NextResponse.json({
                hasBriefing: false,
                message: "No datasets available. Upload data to see AI insights."
            });
        }

        // Get latest briefing
        const latestBriefing = dataset.dailyBriefings[0];

        // Get customer segment summary
        const customerSegmentSummary = dataset.customerSegmentSummary as any;

        // Get forecast summary
        const forecastSummary = dataset.forecastSummary as any;

        // Get insight feed (anomalies, alerts)
        const insightFeed = (dataset.insightFeed as any[]) || [];

        // If no briefing exists, generate a default one
        if (!latestBriefing) {
            return NextResponse.json({
                hasBriefing: false,
                briefing: {
                    executiveSummary: "AI analysis is being prepared. Run the Daily Briefing cron job to generate insights.",
                    keyMetrics: {
                        total_revenue: 0,
                        total_orders: 0,
                        revenue_change_pct: 0
                    },
                    generatedAt: new Date()
                },
                customerSegments: customerSegmentSummary || {
                    champions: 0,
                    loyalists: 0,
                    potential_loyalists: 0,
                    at_risk: 0,
                    hibernating: 0,
                    lost: 0,
                    total_customers: 0
                },
                forecast: forecastSummary || null,
                insights: insightFeed.slice(0, 3),
                lastUpdated: dataset.lastProfiledAt || dataset.uploadedAt
            });
        }

        // Return the briefing data
        return NextResponse.json({
            hasBriefing: true,
            briefing: {
                executiveSummary: latestBriefing.executiveSummary,
                keyMetrics: latestBriefing.keyMetrics,
                anomalies: latestBriefing.anomalies,
                generatedAt: latestBriefing.generatedAt
            },
            customerSegments: customerSegmentSummary || {
                champions: 0,
                loyalists: 0,
                potential_loyalists: 0,
                at_risk: 0,
                hibernating: 0,
                lost: 0,
                total_customers: 0,
                avg_churn_risk: 0,
                total_projected_ltv: 0
            },
            forecast: forecastSummary || {
                projected_revenue: 0,
                growth_rate: "0%",
                confidence: "medium",
                trend: "stable"
            },
            insights: insightFeed.slice(0, 5),
            lastUpdated: latestBriefing.generatedAt
        });

    } catch (error: any) {
        console.error("Dashboard Briefing API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
