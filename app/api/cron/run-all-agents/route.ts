import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { orchestrationService } from "@/lib/agents/orchestration-service";

/**
 * Master Cron Job: Run All AI Agents
 * 
 * This endpoint triggers all AI agents to process datasets.
 * Called after data sync or on a schedule.
 * 
 * Security: Protected by CRON_SECRET or internal call
 */
export async function POST(request: Request) {
    try {
        console.log("[RunAllAgents] Starting AI agent processing...");

        // Get all datasets that need processing
        const datasets = await prisma.dataset.findMany({
            where: {
                status: { in: ["READY", "CLEANED"] },
                rawFileLocation: { not: "" }
            },
            orderBy: { uploadedAt: "desc" },
            take: 10 // Process latest 10 datasets
        });

        if (datasets.length === 0) {
            console.log("[RunAllAgents] No datasets to process");
            return NextResponse.json({
                success: true,
                message: "No datasets to process",
                processed: 0
            });
        }

        const results = {
            success: true,
            processed: 0,
            failed: 0,
            jobs: [] as any[]
        };

        // Process each dataset with proper orchestration
        for (const dataset of datasets) {
            try {
                console.log(`[RunAllAgents] Processing dataset: ${dataset.id} - ${dataset.name}`);
                
                // Run the orchestration pipeline
                const result = await orchestrationService.runPostSyncPipeline(dataset.id);
                
                if (result.success) {
                    results.processed++;
                    console.log(`[RunAllAgents] ✅ Successfully processed dataset ${dataset.id}`);
                } else {
                    results.failed++;
                    console.error(`[RunAllAgents] ❌ Failed to process dataset ${dataset.id}`);
                }
                
                // Merge job results
                results.jobs.push(...result.jobs);

            } catch (error: any) {
                results.failed++;
                results.jobs.push({
                    datasetId: dataset.id,
                    agent: 'Pipeline',
                    success: false,
                    error: error.message
                });
                console.error(`[RunAllAgents] Error processing dataset ${dataset.id}:`, error);
            }
        }

        console.log(`[RunAllAgents] Finished - Processed: ${results.processed}, Failed: ${results.failed}`);

        return NextResponse.json({
            message: `Processed ${results.processed} datasets`,
            ...results
        });

    } catch (error: any) {
        console.error("[RunAllAgents] Fatal error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Also support GET for Vercel cron jobs
export const GET = POST;

