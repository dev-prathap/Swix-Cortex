import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";
import { ShopifyTransformer } from "@/lib/transformers/shopify-transformer";
import * as fs from "fs";
import * as path from "path";

/**
 * Event Consolidation Cron Job
 * Schedule: Every 1 hour
 * Purpose: Move processed real-time events from PostgreSQL to Parquet (hot → cold)
 * 
 * Flow:
 * 1. Get unprocessed RealtimeEvents
 * 2. Transform to normalized format
 * 3. Append to existing Parquet files
 * 4. Mark events as processed
 * 5. Cleanup old processed events (>24h)
 */
export async function GET(req: Request) {
    try {
        console.log("[Consolidation] 🔄 Starting event consolidation job");
        const startTime = Date.now();

        // Get all data sources with unprocessed events
        const dataSources = await prisma.dataSource.findMany({
            where: {
                realtimeEvents: {
                    some: {
                        processed: false
                    }
                }
            },
            include: {
                realtimeEvents: {
                    where: {
                        processed: false,
                        createdAt: {
                            // Only consolidate events older than 10 minutes (give time for real-time queries)
                            lte: new Date(Date.now() - 10 * 60 * 1000)
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (dataSources.length === 0) {
            console.log("[Consolidation] ✅ No events to consolidate");
            return NextResponse.json({
                success: true,
                message: "No events to process",
                processed: 0
            });
        }

        const transformer = new ShopifyTransformer();
        const duckdb = new DuckDBEngine();
        let totalProcessed = 0;
        let totalErrors = 0;

        for (const dataSource of dataSources) {
            try {
                const events = dataSource.realtimeEvents;
                if (events.length === 0) continue;

                console.log(`[Consolidation] Processing ${events.length} events for ${dataSource.name}`);

                // Group events by type
                const orderEvents = events.filter(e => 
                    e.eventType.includes('order') || e.eventType === 'orders/create'
                );
                const productEvents = events.filter(e => 
                    e.eventType.includes('product')
                );
                const customerEvents = events.filter(e => 
                    e.eventType.includes('customer')
                );

                // Transform to normalized format
                const normalizedOrders = orderEvents.map(e => {
                    try {
                        return transformer.transformOrder(e.payload as any);
                    } catch (error) {
                        console.error(`[Consolidation] Transform error for event ${e.id}:`, error);
                        return null;
                    }
                }).filter(Boolean);

                const normalizedProducts = productEvents.flatMap(e => {
                    try {
                        return transformer.transformProduct(e.payload as any);
                    } catch (error) {
                        console.error(`[Consolidation] Transform error for event ${e.id}:`, error);
                        return [];
                    }
                });

                const normalizedCustomers = customerEvents.map(e => {
                    try {
                        return transformer.transformCustomer(e.payload as any);
                    } catch (error) {
                        console.error(`[Consolidation] Transform error for event ${e.id}:`, error);
                        return null;
                    }
                }).filter(Boolean);

                const allNormalizedData = [
                    ...normalizedOrders,
                    ...normalizedProducts,
                    ...normalizedCustomers
                ];

                if (allNormalizedData.length === 0) {
                    console.log(`[Consolidation] No valid data to consolidate for ${dataSource.name}`);
                    continue;
                }

                // Find or create dataset for this data source
                let dataset = await prisma.dataset.findFirst({
                    where: {
                        dataSourceId: dataSource.id,
                        status: { in: ['READY', 'CLEANED'] }
                    },
                    orderBy: { uploadedAt: 'desc' }
                });

                if (!dataset) {
                    // Create new dataset if none exists
                    const fileName = `${dataSource.type.toLowerCase()}_${dataSource.id}_realtime.parquet`;
                    const storagePath = process.env.LOCAL_STORAGE_PATH || "./data/uploads";
                    const filePath = path.join(storagePath, fileName);

                    // Create initial Parquet file
                    const tempJsonPath = filePath.replace('.parquet', '_temp.json');
                    fs.writeFileSync(tempJsonPath, JSON.stringify(allNormalizedData));
                    
                    await duckdb.convertJSONToParquet(tempJsonPath, filePath);
                    fs.unlinkSync(tempJsonPath);

                    dataset = await prisma.dataset.create({
                        data: {
                            userId: dataSource.userId,
                            name: `${dataSource.name} - Real-time`,
                            originalFileName: fileName,
                            rawFileLocation: fileName,
                            fileSize: BigInt(fs.statSync(filePath).size),
                            status: "READY",
                            dataSourceId: dataSource.id
                        } as any
                    });

                    console.log(`[Consolidation] Created new dataset for ${dataSource.name}`);
                } else {
                    // Append to existing Parquet file
                    const filePath = getLocalFilePath(dataset.rawFileLocation);
                    
                    try {
                        // Use DuckDB to append (efficient!)
                        const tempJsonPath = filePath.replace('.parquet', '_append.json');
                        fs.writeFileSync(tempJsonPath, JSON.stringify(allNormalizedData));

                        // Append using DuckDB
                        await duckdb.query(filePath, `
                            COPY (
                                SELECT * FROM read_parquet('${filePath}')
                                UNION ALL
                                SELECT * FROM read_json_auto('${tempJsonPath}')
                            ) TO '${filePath}_new' (FORMAT PARQUET)
                        `);

                        // Replace old file with new one
                        fs.unlinkSync(filePath);
                        fs.renameSync(`${filePath}_new`, filePath);
                        fs.unlinkSync(tempJsonPath);

                        // Update file size
                        await prisma.dataset.update({
                            where: { id: dataset.id },
                            data: { 
                                fileSize: BigInt(fs.statSync(filePath).size),
                                updatedAt: new Date()
                            } as any
                        });

                        console.log(`[Consolidation] Appended ${allNormalizedData.length} records to ${dataset.name}`);
                    } catch (appendError) {
                        console.error(`[Consolidation] Append error:`, appendError);
                        totalErrors++;
                        continue;
                    }
                }

                // Mark events as processed
                await prisma.realtimeEvent.updateMany({
                    where: {
                        id: { in: events.map(e => e.id) }
                    },
                    data: { processed: true }
                });

                totalProcessed += events.length;
                console.log(`[Consolidation] ✅ Processed ${events.length} events for ${dataSource.name}`);

            } catch (error: any) {
                console.error(`[Consolidation] Error processing ${dataSource.name}:`, error);
                totalErrors++;
            }
        }

        // Cleanup: Delete processed events older than 24 hours
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const { count: deletedCount } = await prisma.realtimeEvent.deleteMany({
            where: {
                processed: true,
                createdAt: { lte: cutoffDate }
            }
        });

        if (deletedCount > 0) {
            console.log(`[Consolidation] 🗑️ Cleaned up ${deletedCount} old processed events`);
        }

        duckdb.close();

        const duration = Date.now() - startTime;
        console.log(`[Consolidation] ✅ Completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: "Event consolidation completed",
            stats: {
                events_processed: totalProcessed,
                data_sources: dataSources.length,
                errors: totalErrors,
                old_events_deleted: deletedCount,
                duration_ms: duration
            }
        });

    } catch (error: any) {
        console.error("[Consolidation] Job Failed:", error);
        return NextResponse.json(
            { error: "Consolidation failed", details: error.message },
            { status: 500 }
        );
    }
}

