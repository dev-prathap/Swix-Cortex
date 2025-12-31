import { ShopifyConnector } from "../connectors/shopify-connector";
import { StripeConnector } from "../connectors/stripe-connector";
import { WooCommerceConnector } from "../connectors/woocommerce-connector";
import { ShopifyTransformer } from "../transformers/shopify-transformer";
import prisma from "../prisma";
import * as fs from "fs";
import * as path from "path";
import { DuckDBEngine } from "../data/duckdb-engine";

export class SyncService {
    async syncDataSource(dataSourceId: string) {
        console.log(`[SyncService] Starting sync for data source: ${dataSourceId}`);
        const dataSource = await prisma.dataSource.findUnique({
            where: { id: dataSourceId },
        });

        if (!dataSource) {
            console.error(`[SyncService] Data source not found: ${dataSourceId}`);
            throw new Error("Data source not found");
        }

        const details = JSON.parse(dataSource.connectionDetails);
        let data: any[] = [];

        const type = dataSource.type as any;
        let syncResults: { type: string; count: number }[] = [];

        if (type === "SHOPIFY") {
            const connector = new ShopifyConnector(details.shopName, details.accessToken);
            const transformer = new ShopifyTransformer();

            // Fetch raw data from Shopify
            const [rawOrders, rawProducts, rawCustomers] = await Promise.all([
                connector.fetchOrders(),
                connector.fetchProducts(),
                connector.fetchCustomers()
            ]);

            // Transform to normalized schema
            const orders = rawOrders.map((order: any) => transformer.transformOrder(order));
            const products = rawProducts.flatMap((product: any) => transformer.transformProduct(product));
            const customers = rawCustomers.map((customer: any) => transformer.transformCustomer(customer));

            data = [...orders, ...products, ...customers];
            console.log(`[SyncService] Shopify sync & transform: ${orders.length} orders, ${products.length} products, ${customers.length} customers`);
            syncResults = [
                { type: "orders", count: orders.length },
                { type: "products", count: products.length },
                { type: "customers", count: customers.length }
            ];
        } else if (type === "STRIPE") {
            const connector = new StripeConnector(details.apiKey);
            const charges = await connector.fetchCharges();
            data = charges.map((item: any) => ({ ...item, _type: 'charge' }));
            console.log(`[SyncService] Stripe sync: ${data.length} charges`);
            syncResults = [{ type: "charges", count: data.length }];
        } else if (type === "WOOCOMMERCE") {
            const connector = new WooCommerceConnector(details.url, details.consumerKey, details.consumerSecret);
            const orders = await connector.fetchOrders();
            data = orders.map((item: any) => ({ ...item, _type: 'order' }));
            console.log(`[SyncService] WooCommerce sync: ${data.length} orders`);
            syncResults = [{ type: "orders", count: data.length }];
        }

        if (data.length > 0) {
            // Save to a JSON/CSV file for DuckDB
            const fileName = `${dataSource.type.toLowerCase()}_${dataSourceId}_${Date.now()}.json`;
            const storagePath = process.env.LOCAL_STORAGE_PATH || "./data/uploads";

            if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
            }

            const filePath = path.join(storagePath, fileName);
            fs.writeFileSync(filePath, JSON.stringify(data));
            console.log(`[SyncService] Data saved to: ${filePath}`);

            // Convert to Parquet for optimized storage
            const parquetFileName = fileName.replace('.json', '.parquet');
            const parquetPath = path.join(storagePath, parquetFileName);

            try {
                const duckdb = new DuckDBEngine();
                await duckdb.convertJSONToParquet(filePath, parquetPath);
                console.log(`[SyncService] Data converted to Parquet: ${parquetPath}`);

                // Optional: Remove JSON file after conversion to save space
                // fs.unlinkSync(filePath); 
            } catch (convError) {
                console.error(`[SyncService] Parquet conversion failed:`, convError);
                // Fallback to JSON if conversion fails
            }

            const finalFileLocation = fs.existsSync(parquetPath) ? parquetFileName : fileName;

            // Create or update Dataset
            const dataset = await prisma.dataset.create({
                data: {
                    userId: dataSource.userId,
                    name: `${dataSource.name} Sync`,
                    originalFileName: fileName,
                    rawFileLocation: finalFileLocation,
                    fileSize: BigInt(fs.statSync(path.join(storagePath, finalFileLocation)).size),
                    status: "READY",
                    dataSourceId: dataSourceId, // Link to data source
                } as any,
            });
            console.log(`[SyncService] Dataset created for: ${dataSource.name}`);

            // Update last sync
            await prisma.dataSource.update({
                where: { id: dataSourceId },
                data: { lastSync: new Date(), status: "ACTIVE" },
            });
            console.log(`[SyncService] Sync completed for: ${dataSource.name}`);

            // Trigger AI Processing asynchronously
            this.triggerAIProcessingAsync(dataset.id, finalFileLocation).catch(err => {
                console.error("[SyncService] AI processing failed:", err);
            });

        } else {
            console.log(`[SyncService] No data found to sync for: ${dataSource.name}`);
        }
    }

    /**
     * Trigger AI Agents to analyze the new dataset
     */
    async triggerAIProcessing(datasetId: string, filePath: string) {
        console.log(`[SyncService] Triggering AI Agents for dataset: ${datasetId}`);
        const { CustomerProfilerAgent } = await import("../agents/customer-profiler-agent");
        const { InventoryAgent } = await import("../agents/inventory-agent");
        const { ExecutiveAgent } = await import("../agents/executive-agent");
        const { getLocalFilePath } = await import("../data/duckdb-engine");

        // Resolve full file path
        const fullFilePath = getLocalFilePath(filePath);
        console.log(`[SyncService] Resolved file path: ${fullFilePath}`);

        try {
            // 1. Customer Profiling
            const profiler = new CustomerProfilerAgent();
            const profiles = await profiler.profileCustomersFromDataset(datasetId, fullFilePath);
            const customerSummary = await profiler.generateSegmentSummary(profiles);

            // Save Profiles
            await prisma.customerProfile.createMany({
                data: profiles.map(p => ({
                    datasetId,
                    customerId: p.customerId,
                    customerName: p.customerName,
                    rfmScore: p.rfm_score as any,
                    segment: p.segment,
                    churnRisk: p.churn_risk as any,
                    lifetimeValue: p.lifetime_value as any,
                    behavioralInsights: p.behavioral_insights as any,
                    recommendations: p.recommendations
                })),
                skipDuplicates: true
            });

            // Update Dataset with Summary
            await prisma.dataset.update({
                where: { id: datasetId },
                data: {
                    customerSegmentSummary: customerSummary as any,
                    lastProfiledAt: new Date()
                }
            });

            // 2. Inventory Analysis
            const inventoryAgent = new InventoryAgent();
            const inventoryInsights = await inventoryAgent.analyzeInventory(datasetId, fullFilePath);

            // Save Insights
            await prisma.productInsight.createMany({
                data: inventoryInsights.map(i => ({
                    datasetId,
                    productSku: i.productSku,
                    productName: i.productName,
                    currentStock: i.currentStock,
                    predictedStockoutDays: i.predictedStockoutDays,
                    riskLevel: i.riskLevel,
                    recommendation: i.recommendation
                })),
                skipDuplicates: true
            });

            // 3. Executive Briefing
            const executive = new ExecutiveAgent();
            // Mock sales metrics for now (or calculate via DuckDB if time permits)
            const salesMetrics = {
                total_revenue: customerSummary.total_projected_ltv, // Proxy
                total_orders: profiles.reduce((sum, p) => sum + p.lifetime_value.total_orders, 0),
                revenue_change_pct: 5.2 // Mock
            };

            const briefing = await executive.generateDailyBriefing(
                new Date(),
                customerSummary,
                inventoryInsights,
                salesMetrics
            );

            await prisma.dailyBriefing.create({
                data: {
                    datasetId,
                    briefingDate: new Date(),
                    executiveSummary: briefing.executiveSummary,
                    keyMetrics: briefing.keyMetrics,
                    anomalies: briefing.anomalies
                }
            });

            console.log(`[SyncService] AI Processing Completed for ${datasetId}`);

        } catch (error) {
            console.error("[SyncService] AI Processing Failed:", error);
        }
    }

    /**
     * Trigger AI Processing Asynchronously via Cron Job
     * This doesn't block the sync response
     */
    async triggerAIProcessingAsync(datasetId: string, filePath: string) {
        console.log(`[SyncService] Triggering async AI processing for dataset: ${datasetId}`);
        
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const cronSecret = process.env.CRON_SECRET || "dev-secret-change-in-production";

            // Call master cron job with internal flag
            const response = await fetch(`${baseUrl}/api/cron/run-all-agents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-call": "true",
                    "authorization": `Bearer ${cronSecret}`
                },
                body: JSON.stringify({ 
                    datasetId,
                    trigger: "sync_completed" 
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[SyncService] AI agents triggered successfully:`, result);
            } else {
                console.error(`[SyncService] Failed to trigger AI agents:`, response.statusText);
            }
        } catch (error) {
            console.error("[SyncService] Error triggering async AI processing:", error);
            // Fallback to sync processing if async fails
            console.log("[SyncService] Falling back to synchronous processing...");
            await this.triggerAIProcessing(datasetId, filePath);
        }
    }
}
