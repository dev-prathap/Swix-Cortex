/**
 * Agent Orchestration Service
 * 
 * Coordinates AI agents in the correct order with proper data flow.
 * Runs automatically after data sync to generate insights.
 */

import prisma from "@/lib/prisma";
import { ProfilingAgent } from "./profiling-agent";
import { InventoryAgent } from "./inventory-agent";
import { CustomerProfilerAgent } from "./customer-profiler-agent";
import { ExecutiveAgent } from "./executive-agent";
import { AnomalyAgent } from "./anomaly-agent";
import { ForecastingAgent } from "./forecasting-agent";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

export interface OrchestrationResult {
    success: boolean;
    processed: number;
    failed: number;
    jobs: Array<{
        datasetId: string;
        agent: string;
        success: boolean;
        error?: string;
        duration?: number;
    }>;
}

/**
 * Post-Sync AI Pipeline
 * 
 * Execution Order:
 * 1. ProfilingAgent - Analyzes schema and data quality
 * 2. InventoryAgent - Predicts stockouts (if e-commerce data)
 * 3. CustomerProfilerAgent - Profiles each customer (deferred to background)
 * 
 * Note: Executive briefing runs separately via /api/dashboard/briefing
 */
export class AgentOrchestrationService {
    
    /**
     * Run all applicable agents for a newly synced dataset
     */
    async runPostSyncPipeline(datasetId: string): Promise<OrchestrationResult> {
        console.log(`[Orchestration] Starting post-sync pipeline for dataset: ${datasetId}`);
        
        const startTime = Date.now();
        const jobs: OrchestrationResult['jobs'] = [];
        
        try {
            // Fetch dataset with metadata
            const dataset = await prisma.dataset.findUnique({
                where: { id: datasetId },
                include: { dataSource: true }
            });

            if (!dataset || !dataset.rawFileLocation) {
                throw new Error(`Dataset ${datasetId} not found or has no file path`);
            }

            const filePath = getLocalFilePath(dataset.rawFileLocation);
            
            // Check dataset domain for conditional agent execution
            const profile = await prisma.dataProfile.findUnique({
                where: { datasetId }
            });

            const isEcommerce = profile?.domain?.toLowerCase().includes('commerce') 
                || profile?.domain?.toLowerCase().includes('retail')
                || dataset.name.toLowerCase().includes('shopify')
                || dataset.name.toLowerCase().includes('woocommerce');
            
            // ========================================
            // STEP 1: Profile Dataset (Schema Analysis)
            // ========================================
            const profilingAgent = new ProfilingAgent();
            const profilingStart = Date.now();
            
            try {
                await profilingAgent.profileDataset(datasetId);
                
                jobs.push({
                    datasetId,
                    agent: 'ProfilingAgent',
                    success: true,
                    duration: Date.now() - profilingStart
                });
                
                console.log(`[Orchestration] ✅ ProfilingAgent completed (${Date.now() - profilingStart}ms)`);
            } catch (error: any) {
                jobs.push({
                    datasetId,
                    agent: 'ProfilingAgent',
                    success: false,
                    error: error.message,
                    duration: Date.now() - profilingStart
                });
                
                console.error(`[Orchestration] ❌ ProfilingAgent failed:`, error.message);
                // Don't stop pipeline - continue with other agents
            }

            // ========================================
            // STEP 2: Inventory Analysis (DEFERRED - Run manually via "Optimize Stock" button)
            // ========================================
            // InventoryAgent is computationally expensive (2-3 minutes, requires AI calls for each product)
            // It should be triggered on-demand by users, not automatically after every sync
            console.log(`[Orchestration] ⏭️  InventoryAgent deferred to manual trigger`);
            
            // FUTURE: Uncomment below if you want automatic inventory analysis
            /*
            const inventoryAgent = new InventoryAgent();
            const inventoryStart = Date.now();
            
            try {
                if (isEcommerce) {
                    const inventoryInsights = await inventoryAgent.analyzeInventory(
                        datasetId,
                        filePath,
                        50 // Top 50 products
                    );

                    // Store insights in database (individual creates due to JSON field)
                    for (const insight of inventoryInsights) {
                        await prisma.insight.create({
                            data: {
                                datasetId,
                                type: 'inventory_alert',
                                title: `${insight.productName} - ${insight.riskLevel.toUpperCase()} Risk`,
                                content: insight.recommendation,
                                severity: insight.riskLevel === 'critical' ? 'critical' 
                                        : insight.riskLevel === 'high' ? 'high' 
                                        : 'medium',
                                metadata: {
                                    sku: insight.productSku,
                                    currentStock: insight.currentStock,
                                    predictedStockoutDays: insight.predictedStockoutDays
                                } as any
                            }
                        });
                    }

                    jobs.push({
                        datasetId,
                        agent: 'InventoryAgent',
                        success: true,
                        duration: Date.now() - inventoryStart
                    });
                    
                    console.log(`[Orchestration] ✅ InventoryAgent completed - ${inventoryInsights.length} insights (${Date.now() - inventoryStart}ms)`);
                } else {
                    console.log(`[Orchestration] ⏭️  InventoryAgent skipped (not e-commerce data)`);
                }
                
            } catch (error: any) {
                jobs.push({
                    datasetId,
                    agent: 'InventoryAgent',
                    success: false,
                    error: error.message,
                    duration: Date.now() - inventoryStart
                });
                
                console.error(`[Orchestration] ❌ InventoryAgent failed:`, error.message);
            }
            */

            // ========================================
            // STEP 3: Anomaly Detection (E-commerce only)
            // ========================================
            const anomalyAgent = new AnomalyAgent();
            const anomalyStart = Date.now();
            
            try {
                if (isEcommerce) {
                    // Get sales data for anomaly detection
                    const duckdb = new DuckDBEngine();
                    const salesQuery = `
                        SELECT 
                            CAST(created_at AS DATE) as date,
                            COUNT(*) as order_count,
                            SUM(CAST(total_price AS DOUBLE)) as revenue
                        FROM {{readFunction}}
                        WHERE _type = 'order'
                        GROUP BY date
                        ORDER BY date DESC
                        LIMIT 30
                    `;
                    
                    const salesData = await duckdb.query(filePath, salesQuery);
                    duckdb.close();
                    
                    if (salesData.length >= 7) {
                        // Detect anomalies
                        const anomalyReport = await anomalyAgent.detect(
                            "Analyze recent sales patterns for anomalies",
                            salesData,
                            { metric: "daily_sales", threshold: "2_std_dev" }
                        );
                        
                        // Store critical anomalies as insights
                        // TODO: Re-enable when Insight model is added to schema
                        // if (anomalyReport && !anomalyReport.toLowerCase().includes('no significant anomalies')) {
                        //     await prisma.insight.create({
                        //         data: {
                        //             datasetId,
                        //             type: 'anomaly_alert',
                        //             title: 'Sales Anomaly Detected',
                        //             content: anomalyReport,
                        //             severity: 'high',
                        //             metadata: { detectionDate: new Date() }
                        //         }
                        //     });
                        // }
                        
                        jobs.push({
                            datasetId,
                            agent: 'AnomalyAgent',
                            success: true,
                            duration: Date.now() - anomalyStart
                        });
                        
                        console.log(`[Orchestration] ✅ AnomalyAgent completed (${Date.now() - anomalyStart}ms)`);
                    } else {
                        console.log(`[Orchestration] ⏭️  AnomalyAgent skipped (insufficient data)`);
                    }
                } else {
                    console.log(`[Orchestration] ⏭️  AnomalyAgent skipped (not e-commerce data)`);
                }
                
            } catch (error: any) {
                jobs.push({
                    datasetId,
                    agent: 'AnomalyAgent',
                    success: false,
                    error: error.message,
                    duration: Date.now() - anomalyStart
                });
                
                console.error(`[Orchestration] ❌ AnomalyAgent failed:`, error.message);
            }

            // ========================================
            // STEP 4: Revenue Forecasting (E-commerce only)
            // ========================================
            const forecastingAgent = new ForecastingAgent();
            const forecastStart = Date.now();
            
            try {
                if (isEcommerce) {
                    // Get historical revenue data
                    const duckdb = new DuckDBEngine();
                    const revenueQuery = `
                        SELECT 
                            strftime('%Y-%m', CAST(created_at AS DATE)) as period,
                            SUM(CAST(total_price AS DOUBLE)) as revenue,
                            COUNT(*) as orders
                        FROM {{readFunction}}
                        WHERE _type = 'order'
                        GROUP BY period
                        ORDER BY period ASC
                    `;
                    
                    const revenueData = await duckdb.query(filePath, revenueQuery);
                    duckdb.close();
                    
                    if (revenueData.length >= 3) {
                        // Generate forecast
                        const forecastReport = await forecastingAgent.forecast(
                            "Forecast revenue for next 3 months",
                            revenueData,
                            { type: "revenue", periods: 3 }
                        );
                        
                        // Store forecast summary in dataset
                        await prisma.dataset.update({
                            where: { id: datasetId },
                            data: {
                                forecastSummary: {
                                    generatedAt: new Date(),
                                    forecast: forecastReport,
                                    basedOnPeriods: revenueData.length
                                }
                            }
                        });
                        
                        jobs.push({
                            datasetId,
                            agent: 'ForecastingAgent',
                            success: true,
                            duration: Date.now() - forecastStart
                        });
                        
                        console.log(`[Orchestration] ✅ ForecastingAgent completed (${Date.now() - forecastStart}ms)`);
                    } else {
                        console.log(`[Orchestration] ⏭️  ForecastingAgent skipped (insufficient data)`);
                    }
                } else {
                    console.log(`[Orchestration] ⏭️  ForecastingAgent skipped (not e-commerce data)`);
                }
                
            } catch (error: any) {
                jobs.push({
                    datasetId,
                    agent: 'ForecastingAgent',
                    success: false,
                    error: error.message,
                    duration: Date.now() - forecastStart
                });
                
                console.error(`[Orchestration] ❌ ForecastingAgent failed:`, error.message);
            }

            // ========================================
            // STEP 5: Customer Profiling (Background Job)
            // ========================================
            // NOTE: This is CPU-intensive and should run in background
            // For now, we defer this to the /api/customers/profiles route
            // which can be triggered manually or via a separate cron job
            
            console.log(`[Orchestration] ⏭️  CustomerProfilerAgent deferred to background job`);

            // ========================================
            // PIPELINE SUMMARY
            // ========================================
            const totalDuration = Date.now() - startTime;
            const successCount = jobs.filter(j => j.success).length;
            const failCount = jobs.filter(j => !j.success).length;

            console.log(`[Orchestration] Pipeline completed in ${totalDuration}ms - Success: ${successCount}, Failed: ${failCount}`);

            return {
                success: failCount === 0,
                processed: successCount,
                failed: failCount,
                jobs
            };

        } catch (error: any) {
            console.error(`[Orchestration] Fatal pipeline error:`, error);
            
            return {
                success: false,
                processed: 0,
                failed: 1,
                jobs: [{
                    datasetId,
                    agent: 'Pipeline',
                    success: false,
                    error: error.message
                }]
            };
        }
    }

    /**
     * Run Customer Profiling for all customers in a dataset
     * (CPU-intensive, run in background or via separate cron)
     */
    async runCustomerProfiling(datasetId: string): Promise<{ profiled: number; errors: number }> {
        console.log(`[Orchestration] Starting customer profiling for dataset: ${datasetId}`);
        
        try {
            const dataset = await prisma.dataset.findUnique({
                where: { id: datasetId }
            });

            if (!dataset || !dataset.rawFileLocation) {
                throw new Error(`Dataset ${datasetId} not found`);
            }

            const filePath = getLocalFilePath(dataset.rawFileLocation);
            const duckdb = new DuckDBEngine();

            // Extract unique customers with their order history
            const customersQuery = `
                SELECT 
                    customer_id,
                    customer_name,
                    customer_email,
                    LIST(STRUCT_PACK(
                        order_date := order_date,
                        amount := total_price,
                        products := line_items
                    )) as orders
                WHERE _type = 'order' AND customer_id IS NOT NULL
                GROUP BY customer_id, customer_name, customer_email
                LIMIT 100  -- Process in batches
            `;

            const customers = await duckdb.query(filePath, customersQuery);
            const profiler = new CustomerProfilerAgent();

            let profiled = 0;
            let errors = 0;

            for (const customer of customers) {
                try {
                    const profile = await profiler.profileCustomer(
                        customer.customer_id,
                        {
                            name: customer.customer_name,
                            email: customer.customer_email,
                            orders: customer.orders || []
                        }
                    );

                    // Store profile in DB
                    await prisma.customerProfile.upsert({
                        where: { 
                            datasetId_customerId: {
                                datasetId,
                                customerId: customer.customer_id
                            }
                        },
                        create: {
                            datasetId,
                            customerId: customer.customer_id,
                            customerName: profile.customerName,
                            rfmScore: profile.rfm_score,
                            segment: profile.segment,
                            churnRisk: profile.churn_risk,
                            lifetimeValue: profile.lifetime_value,
                            behavioralInsights: profile.behavioral_insights,
                            recommendations: profile.recommendations
                        },
                        update: {
                            customerName: profile.customerName,
                            rfmScore: profile.rfm_score,
                            segment: profile.segment,
                            churnRisk: profile.churn_risk,
                            lifetimeValue: profile.lifetime_value,
                            behavioralInsights: profile.behavioral_insights,
                            recommendations: profile.recommendations
                        }
                    });

                    profiled++;
                } catch (error: any) {
                    console.error(`[Orchestration] Failed to profile customer ${customer.customer_id}:`, error.message);
                    errors++;
                }
            }

            console.log(`[Orchestration] Customer profiling complete - Profiled: ${profiled}, Errors: ${errors}`);
            
            return { profiled, errors };
            
        } catch (error: any) {
            console.error(`[Orchestration] Customer profiling pipeline failed:`, error);
            throw error;
        }
    }

    /**
     * Generate Executive Daily Briefing
     * (Aggregates insights from all agents)
     */
    async generateDailyBriefing(datasetId: string): Promise<any> {
        console.log(`[Orchestration] Generating executive briefing for dataset: ${datasetId}`);
        
        try {
            const dataset = await prisma.dataset.findUnique({
                where: { id: datasetId },
                include: {
                    dataSource: true
                }
            });

            if (!dataset || !dataset.rawFileLocation) {
                throw new Error(`Dataset ${datasetId} not found`);
            }

            const filePath = getLocalFilePath(dataset.rawFileLocation);
            const duckdb = new DuckDBEngine();
            
            // ========================================
            // 1. Gather Sales Metrics
            // ========================================
            const salesQuery = `
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CAST(total_price AS DOUBLE)) as total_revenue,
                    AVG(CAST(total_price AS DOUBLE)) as avg_order_value,
                    COUNT(DISTINCT customer_id) as unique_customers
                FROM {{readFunction}}
                WHERE _type = 'order'
            `;
            
            const salesMetrics = await duckdb.query(filePath, salesQuery);
            const sales = salesMetrics[0] || {};
            
            // ========================================
            // 2. Get Customer Segment Summary
            // ========================================
            const customerProfiles = await prisma.customerProfile.findMany({
                where: { datasetId },
                select: {
                    segment: true,
                    churnRisk: true,
                    lifetimeValue: true
                }
            });
            
            const customerSummary = {
                total: customerProfiles.length,
                champions: customerProfiles.filter(p => p.segment === 'Champion').length,
                atRisk: customerProfiles.filter(p => p.churnRisk === 'high').length,
                avgLTV: customerProfiles.reduce((sum, p) => sum + (Number(p.lifetimeValue) || 0), 0) / (customerProfiles.length || 1)
            };
            
            // ========================================
            // 3. Get Inventory Insights (Top 5 Critical)
            // ========================================
            // TODO: Re-enable when Insight model is added to schema
            const inventoryInsights: any[] = [];
            // const inventoryInsights = await prisma.insight.findMany({
            //     where: {
            //         datasetId,
            //         type: 'inventory_alert',
            //         severity: { in: ['critical', 'high'] }
            //     },
            //     orderBy: { createdAt: 'desc' },
            //     take: 5
            // });
            
            duckdb.close();
            
            // ========================================
            // 4. Generate Executive Briefing via AI
            // ========================================
            const executiveAgent = new ExecutiveAgent();
            const briefing = await executiveAgent.generateDailyBriefing(
                new Date(),
                customerSummary,
                inventoryInsights.map(i => ({
                    product: i.title,
                    risk: i.severity,
                    recommendation: i.content
                })),
                {
                    totalOrders: sales.total_orders || 0,
                    totalRevenue: sales.total_revenue || 0,
                    avgOrderValue: sales.avg_order_value || 0,
                    uniqueCustomers: sales.unique_customers || 0
                }
            );
            
            // ========================================
            // 5. Store Briefing in Database
            // ========================================
            const dailyBriefing = await prisma.dailyBriefing.create({
                data: {
                    datasetId,
                    briefingDate: new Date(),
                    executiveSummary: briefing.executiveSummary,
                    keyMetrics: briefing.keyMetrics,
                    anomalies: briefing.anomalies,
                    generatedAt: new Date()
                }
            });
            
            console.log(`[Orchestration] ✅ Executive briefing generated and stored`);
            
            return {
                success: true,
                briefingId: dailyBriefing.id,
                summary: briefing.executiveSummary
            };
            
        } catch (error: any) {
            console.error(`[Orchestration] ❌ Executive briefing failed:`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const orchestrationService = new AgentOrchestrationService();

