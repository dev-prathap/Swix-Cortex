import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Inventory Insights API
 * Returns AI-generated product insights and stockout predictions
 */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const cookieStore = await cookies();
        const isDemoMode = cookieStore.get("swix_demo_mode")?.value === "true";

        // Get the most recent dataset
        const dataset = await prisma.dataset.findFirst({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] }
                // Removed isDemo filter - show insights for all datasets
            },
            orderBy: { uploadedAt: 'desc' },
            include: {
                productInsights: {
                    orderBy: { createdAt: 'desc' }, // Latest insights first
                    take: 50
                }
            }
        });

        if (!dataset) {
            return NextResponse.json({
                insights: [],
                message: "No datasets available."
            });
        }

        const insights = dataset.productInsights || [];

        return NextResponse.json({
            insights: insights.map((p: any) => {
                // Calculate stockout date
                const days = p.predictedStockoutDays || 30;
                const stockoutDate = new Date();
                stockoutDate.setDate(stockoutDate.getDate() + days);

                return {
                    id: p.id,
                    productId: p.productSku, // Use SKU as ID if needed
                    productName: p.productName,
                    sku: p.productSku,
                    currentStock: p.currentStock,
                    predictedStockoutDate: stockoutDate.toISOString(),
                    daysUntilStockout: days,
                    reorderPoint: Math.round(p.currentStock * 0.5), // Mock reorder point
                    reorderQuantity: Math.round(p.currentStock * 1.2), // Mock reorder quantity
                    riskLevel: p.riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
                    trend: "STABLE", // Mock trend as it's not in schema
                    reasoning: p.recommendation
                };
            })
        });

    } catch (error: any) {
        console.error("Inventory Insights API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
