import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { InventoryAgent } from "@/lib/agents/inventory-agent";
import { getLocalFilePath } from "@/lib/data/duckdb-engine";

// In-memory lock to prevent concurrent inventory generation per user
const generationLocks = new Map<string, boolean>();

/**
 * Manual Inventory Insights Generation
 * Generates stockout predictions and reorder recommendations for user's datasets
 */
export async function POST() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if generation is already in progress for this user
    if (generationLocks.get(userId)) {
        console.log("[InventoryAgent] Generation already in progress for user:", userId);
        return NextResponse.json({
            success: false,
            message: "Inventory analysis already in progress. Please wait.",
            insights_generated: 0
        }, { status: 429 });
    }

    // Set lock
    generationLocks.set(userId, true);

    try {
        console.log("[InventoryAgent] Manual inventory analysis started");
        const startTime = Date.now();

        // Get user's active datasets
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" }
            },
            include: {
                profile: true
            }
        });

        if (datasets.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No datasets found. Please upload or sync data first.",
                insights_generated: 0
            });
        }

        const inventoryAgent = new InventoryAgent();
        let totalInsightsGenerated = 0;
        const errors: string[] = [];

        for (const dataset of datasets) {
            try {
                console.log(`[InventoryAgent] Processing dataset: ${dataset.name}`);

                const filePath = getLocalFilePath(dataset.rawFileLocation);

                // Generate inventory insights
                const insights = await inventoryAgent.analyzeInventory(
                    dataset.id,
                    filePath,
                    50 // Analyze top 50 products by stock level
                );

                console.log(`[InventoryAgent] Generated ${insights.length} insights for ${dataset.name}`);

                // Store insights in database
                // First, delete old insights for this dataset
                await prisma.productInsight.deleteMany({
                    where: { datasetId: dataset.id }
                });

                // Then create new ones
                for (const insight of insights) {
                    await prisma.productInsight.create({
                        data: {
                            datasetId: dataset.id,
                            productSku: insight.productSku,
                            productName: insight.productName,
                            currentStock: insight.currentStock,
                            predictedStockoutDays: insight.predictedStockoutDays,
                            riskLevel: insight.riskLevel,
                            recommendation: insight.recommendation
                        }
                    });
                }

                totalInsightsGenerated += insights.length;

            } catch (error: any) {
                console.error(`[InventoryAgent] Error processing dataset ${dataset.name}:`, error);
                errors.push(`${dataset.name}: ${error.message}`);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[InventoryAgent] Completed in ${duration}ms`);
        console.log(`[InventoryAgent] Total insights generated: ${totalInsightsGenerated}`);

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${totalInsightsGenerated} inventory insights`,
            stats: {
                datasets_processed: datasets.length,
                insights_generated: totalInsightsGenerated,
                duration_ms: duration,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error: any) {
        console.error("[InventoryAgent] Failed:", error);
        return NextResponse.json(
            { error: "Inventory analysis failed", details: error.message },
            { status: 500 }
        );
    } finally {
        // Always release lock
        generationLocks.delete(userId);
        console.log("[InventoryAgent] Lock released for user:", userId);
    }
}

