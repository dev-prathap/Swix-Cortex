import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Customer Profiles API
 * Returns the list of profiled customers with RFM scores and segments
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
                status: { in: ["READY", "CLEANED", "PROFILED"] }
                // Removed isDemo filter - show profiles for all datasets
            },
            orderBy: { uploadedAt: 'desc' },
            include: {
                customerProfiles: {
                    orderBy: { createdAt: 'desc' }, // Order by creation date
                    take: 100 // Limit to top 100 for performance
                }
            }
        } as any) as any;

        if (!dataset) {
            console.log('[CustomerProfiles] No dataset found for user:', userId);
            return NextResponse.json({
                profiles: [],
                message: "No datasets available."
            });
        }

        const profiles = dataset.customerProfiles || [];
        console.log(`[CustomerProfiles] Found ${profiles.length} profiles for dataset:`, dataset.id, 'Status:', dataset.status);

        // Sort by RFM total score (descending) - show top customers first
        const sortedProfiles = profiles.sort((a: any, b: any) => {
            const aScore = a.rfmScore?.total_score || 0;
            const bScore = b.rfmScore?.total_score || 0;
            return bScore - aScore;
        });

        return NextResponse.json({
            profiles: sortedProfiles.map((p: any) => {
                const churnData = p.churnRisk || {};
                const ltvData = p.lifetimeValue || {};
                const rfm = p.rfmScore || {};

                // Calculate next purchase date
                const nextDays = churnData.expected_next_purchase_days || 30;
                const nextPurchaseDate = new Date();
                nextPurchaseDate.setDate(nextPurchaseDate.getDate() + nextDays);

                let probability = churnData.probability || 0;
                if (probability > 1) probability = probability / 100;

                return {
                    id: p.id,
                    customerId: p.customerId,
                    customerName: p.customerName,
                    segment: p.segment,
                    rfmScore: {
                        recency: rfm.recency_score,
                        frequency: rfm.frequency_score,
                        monetary: rfm.monetary_score,
                        total: rfm.total_score
                    },
                    churnRisk: probability,
                    ltv: ltvData.projected_ltv_12m || ltvData.total_spent || 0,
                    nextPurchaseDate: nextPurchaseDate.toISOString(),
                    lastOrderDate: new Date().toISOString(), // Placeholder if not in profile
                    recommendations: p.recommendations
                };
            })
        });

    } catch (error: any) {
        console.error("Customer Profiles API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
