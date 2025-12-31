import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { CustomerProfilerAgent } from "@/lib/agents/customer-profiler-agent";
import { getLocalFilePath } from "@/lib/data/duckdb-engine";
import { cookies } from "next/headers";

// In-memory lock to prevent concurrent profile generation per user
const generationLocks = new Map<string, boolean>();

/**
 * Manual Customer Profile Generation
 * Generates RFM scores, churn predictions, and customer segments for user's datasets
 */
export async function POST() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if generation is already in progress for this user
    if (generationLocks.get(userId)) {
        console.log("[CustomerProfiler] Generation already in progress for user:", userId);
        return NextResponse.json({
            success: false,
            message: "Profile generation already in progress. Please wait.",
            profiles_generated: 0
        }, { status: 429 });
    }

    // Set lock
    generationLocks.set(userId, true);

    try {
        console.log("[CustomerProfiler] Manual profile generation started");
        const startTime = Date.now();

        const cookieStore = await cookies();
        const isDemoMode = cookieStore.get("swix_demo_mode")?.value === "true";

        // Get user's active datasets
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" }
                // Removed isDemo filter - process all datasets
            },
            include: {
                profile: true
            }
        });

        if (datasets.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No datasets found. Please upload or sync data first.",
                profiles_generated: 0
            });
        }

        const profiler = new CustomerProfilerAgent();
        let totalProfilesGenerated = 0;
        const errors: string[] = [];

        for (const dataset of datasets) {
            try {
                console.log(`[CustomerProfiler] Processing dataset: ${dataset.name}`);

                const filePath = getLocalFilePath(dataset.rawFileLocation);

                // Generate customer profiles
                const profiles = await profiler.profileCustomersFromDataset(
                    dataset.id,
                    filePath,
                    100 // Process top 100 customers by revenue
                );

                console.log(`[CustomerProfiler] Generated ${profiles.length} profiles for ${dataset.name}`);

                // Store profiles in database
                for (const profile of profiles) {
                    await prisma.customerProfile.upsert({
                        where: {
                            datasetId_customerId: {
                                datasetId: dataset.id,
                                customerId: profile.customerId
                            }
                        },
                        update: {
                            customerName: profile.customerName,
                            rfmScore: profile.rfm_score as any,
                            segment: profile.segment,
                            churnRisk: profile.churn_risk as any,
                            lifetimeValue: profile.lifetime_value as any,
                            behavioralInsights: profile.behavioral_insights as any,
                            recommendations: profile.recommendations,
                            lastProfiledAt: new Date()
                        },
                        create: {
                            datasetId: dataset.id,
                            customerId: profile.customerId,
                            customerName: profile.customerName,
                            rfmScore: profile.rfm_score as any,
                            segment: profile.segment,
                            churnRisk: profile.churn_risk as any,
                            lifetimeValue: profile.lifetime_value as any,
                            behavioralInsights: profile.behavioral_insights as any,
                            recommendations: profile.recommendations
                        }
                    });
                }

                // Generate and store segment summary
                const summary = await profiler.generateSegmentSummary(profiles);

                await prisma.dataset.update({
                    where: { id: dataset.id },
                    data: {
                        customerSegmentSummary: summary as any,
                        lastProfiledAt: new Date()
                    }
                });

                totalProfilesGenerated += profiles.length;

            } catch (error: any) {
                console.error(`[CustomerProfiler] Error processing dataset ${dataset.name}:`, error);
                errors.push(`${dataset.name}: ${error.message}`);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[CustomerProfiler] Completed in ${duration}ms`);
        console.log(`[CustomerProfiler] Total profiles generated: ${totalProfilesGenerated}`);

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${totalProfilesGenerated} customer profiles`,
            stats: {
                datasets_processed: datasets.length,
                profiles_generated: totalProfilesGenerated,
                duration_ms: duration,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error: any) {
        console.error("[CustomerProfiler] Failed:", error);
        return NextResponse.json(
            { error: "Profile generation failed", details: error.message },
            { status: 500 }
        );
    } finally {
        // Always release lock
        generationLocks.delete(userId);
        console.log("[CustomerProfiler] Lock released for user:", userId);
    }
}

