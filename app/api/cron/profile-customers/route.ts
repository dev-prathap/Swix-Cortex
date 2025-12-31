import { NextResponse } from "next/server";
import { orchestrationService } from "@/lib/agents/orchestration-service";
import prisma from "@/lib/prisma";

/**
 * Background Job: Profile All Customers
 * 
 * This is a CPU-intensive job that should run separately from the main sync pipeline.
 * Called manually or via a scheduled cron job (e.g., daily at midnight).
 * 
 * Security: Protected by CRON_SECRET
 */
export async function POST(request: Request) {
    try {
        console.log("[ProfileCustomers] Starting customer profiling job...");

        // Get all e-commerce datasets
        const datasets = await prisma.dataset.findMany({
            where: {
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" }
            },
            include: {
                profile: true
            },
            orderBy: { uploadedAt: "desc" },
            take: 5 // Process latest 5 datasets
        });

        if (datasets.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No datasets to process",
                profiled: 0
            });
        }

        let totalProfiled = 0;
        let totalErrors = 0;
        const results: any[] = [];

        for (const dataset of datasets) {
            // Only profile e-commerce datasets
            const isEcommerce = dataset.profile?.domain?.toLowerCase().includes('commerce') 
                || dataset.profile?.domain?.toLowerCase().includes('retail')
                || dataset.name.toLowerCase().includes('shopify')
                || dataset.name.toLowerCase().includes('woocommerce');

            if (!isEcommerce) {
                console.log(`[ProfileCustomers] Skipping non-e-commerce dataset: ${dataset.id}`);
                continue;
            }

            try {
                console.log(`[ProfileCustomers] Profiling customers in dataset: ${dataset.id}`);
                
                const result = await orchestrationService.runCustomerProfiling(dataset.id);
                
                totalProfiled += result.profiled;
                totalErrors += result.errors;
                
                results.push({
                    datasetId: dataset.id,
                    datasetName: dataset.name,
                    profiled: result.profiled,
                    errors: result.errors
                });

                console.log(`[ProfileCustomers] Completed ${dataset.id} - Profiled: ${result.profiled}, Errors: ${result.errors}`);

            } catch (error: any) {
                console.error(`[ProfileCustomers] Failed to profile dataset ${dataset.id}:`, error);
                totalErrors++;
                results.push({
                    datasetId: dataset.id,
                    error: error.message
                });
            }
        }

        console.log(`[ProfileCustomers] Job complete - Total profiled: ${totalProfiled}, Total errors: ${totalErrors}`);

        return NextResponse.json({
            success: true,
            message: `Profiled ${totalProfiled} customers across ${datasets.length} datasets`,
            profiled: totalProfiled,
            errors: totalErrors,
            results
        });

    } catch (error: any) {
        console.error("[ProfileCustomers] Fatal error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Also support GET for Vercel cron jobs
export const GET = POST;
