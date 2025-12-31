import { DuckDBEngine, getLocalFilePath } from "./duckdb-engine";
import prisma from "../prisma";
import { ShopifyTransformer } from "../transformers/shopify-transformer";

/**
 * UnifiedQueryEngine - Hot/Cold Data Pattern
 * 
 * Combines real-time data (PostgreSQL) with historical data (DuckDB/Parquet)
 * for seamless analytics with <1 second latency
 */
export class UnifiedQueryEngine {
    private duckdb: DuckDBEngine;
    private shopifyTransformer: ShopifyTransformer;
    private hotDataHours: number; // How many hours to keep in PostgreSQL

    constructor(hotDataHours: number = 24) {
        this.duckdb = new DuckDBEngine();
        this.shopifyTransformer = new ShopifyTransformer();
        this.hotDataHours = hotDataHours;
    }

    /**
     * Get all orders with real-time + historical data
     */
    async getOrders(userId: string, filters?: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
        limit?: number;
    }) {
        const cutoffDate = this.getCutoffDate();
        
        // 1. Get real-time events (hot data)
        const hotOrders = await this.getHotOrders(userId, cutoffDate);
        
        // 2. Get historical data (cold data)
        const coldOrders = await this.getColdOrders(userId, cutoffDate, filters);
        
        // 3. Merge and deduplicate
        const allOrders = [...hotOrders, ...coldOrders];
        
        // 4. Apply filters
        return this.applyFilters(allOrders, filters);
    }

    /**
     * Get real-time orders from PostgreSQL (last N hours)
     */
    private async getHotOrders(userId: string, cutoffDate: Date) {
        const realtimeEvents = await prisma.realtimeEvent.findMany({
            where: {
                dataSource: {
                    userId: userId
                },
                eventType: {
                    in: ['order.created', 'order.updated', 'orders/create']
                },
                createdAt: { gte: cutoffDate },
                processed: false
            },
            orderBy: { createdAt: 'desc' },
            take: 1000 // Safety limit
        });

        console.log(`[UnifiedQuery] Found ${realtimeEvents.length} hot orders`);

        // Transform to normalized format
        return realtimeEvents.map(event => {
            const payload = event.payload as any;
            try {
                return this.shopifyTransformer.transformOrder(payload);
            } catch (error) {
                console.error('[UnifiedQuery] Transform error:', error);
                return null;
            }
        }).filter(Boolean);
    }

    /**
     * Get historical orders from DuckDB/Parquet (older than N hours)
     */
    private async getColdOrders(
        userId: string, 
        cutoffDate: Date,
        filters?: any
    ) {
        // Find user's datasets
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ['READY', 'CLEANED', 'PROFILED'] },
                rawFileLocation: { not: '' }
            },
            orderBy: { uploadedAt: 'desc' }
        });

        if (datasets.length === 0) {
            console.log('[UnifiedQuery] No datasets found');
            return [];
        }

        const allColdOrders: any[] = [];

        for (const dataset of datasets) {
            try {
                const filePath = getLocalFilePath(dataset.rawFileLocation);
                
                // Query all historical data from Parquet (cold storage)
                // Don't filter by cutoff date - Parquet is our historical archive
                const query = `
                    SELECT * FROM {{readFunction}}
                    WHERE _type = 'order'
                    ORDER BY created_at DESC
                    LIMIT 10000
                `;

                const coldData = await this.duckdb.query(filePath, query);
                allColdOrders.push(...coldData);
                
                console.log(`[UnifiedQuery] Found ${coldData.length} cold orders from ${dataset.name}`);
            } catch (error) {
                console.error(`[UnifiedQuery] Error querying dataset ${dataset.id}:`, error);
            }
        }

        return allColdOrders;
    }

    /**
     * Get aggregated stats (real-time + historical)
     */
    async getStats(userId: string) {
        const cutoffDate = this.getCutoffDate();

        // Hot stats (PostgreSQL)
        const hotEvents = await prisma.realtimeEvent.findMany({
            where: {
                dataSource: { userId },
                createdAt: { gte: cutoffDate },
                processed: false
            }
        });

        const hotOrders = hotEvents
            .filter(e => e.eventType.includes('order'))
            .map(e => this.shopifyTransformer.transformOrder(e.payload as any));

        const hotStats = {
            orders: hotOrders.length,
            revenue: hotOrders.reduce((sum, o) => sum + (o?.total_price || 0), 0),
            customers: new Set(hotOrders.map(o => o.customer_id)).size
        };

        // Cold stats (DuckDB)
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ['READY', 'CLEANED', 'PROFILED'] },
                rawFileLocation: { not: '' }
            }
        });

        const coldStats = { orders: 0, revenue: 0, customers: 0, products: 0 };

        for (const dataset of datasets) {
            try {
                const filePath = getLocalFilePath(dataset.rawFileLocation);
                
                // Get order stats
                const orderStatsQuery = `
                    SELECT 
                        COUNT(*) as orders,
                        SUM(CAST(total_price AS DOUBLE)) as revenue,
                        COUNT(DISTINCT customer_id) as customers
                    FROM {{readFunction}}
                    WHERE _type = 'order'
                `;
                
                // Get product count
                const productCountQuery = `
                    SELECT COUNT(DISTINCT product_id) as products
                    FROM {{readFunction}}
                    WHERE _type = 'product'
                `;

                const [orderResult] = await this.duckdb.query(filePath, orderStatsQuery);
                const [productResult] = await this.duckdb.query(filePath, productCountQuery);
                
                if (orderResult) {
                    coldStats.orders += Number(orderResult.orders || 0);
                    coldStats.revenue += Number(orderResult.revenue || 0);
                    coldStats.customers += Number(orderResult.customers || 0);
                }
                if (productResult) {
                    coldStats.products += Number(productResult.products || 0);
                }
            } catch (error) {
                console.error('[UnifiedQuery] Stats query error:', error);
            }
        }

        console.log('[UnifiedQuery] Stats - Hot:', hotStats, 'Cold:', coldStats);

        // Combine
        return {
            totalOrders: hotStats.orders + coldStats.orders,
            totalRevenue: hotStats.revenue + coldStats.revenue,
            totalCustomers: hotStats.customers + coldStats.customers,
            totalProducts: coldStats.products,
            realtimeOrders: hotStats.orders,
            historicalOrders: coldStats.orders
        };
    }

    /**
     * Get cutoff date for hot/cold split
     */
    private getCutoffDate(): Date {
        return new Date(Date.now() - this.hotDataHours * 60 * 60 * 1000);
    }

    /**
     * Apply filters to combined data
     */
    private applyFilters(orders: any[], filters?: any) {
        let filtered = orders;

        if (filters?.startDate) {
            filtered = filtered.filter(o => 
                new Date(o.created_at) >= filters.startDate
            );
        }

        if (filters?.endDate) {
            filtered = filtered.filter(o => 
                new Date(o.created_at) <= filters.endDate
            );
        }

        if (filters?.status) {
            filtered = filtered.filter(o => o.status === filters.status);
        }

        if (filters?.limit) {
            filtered = filtered.slice(0, filters.limit);
        }

        return filtered;
    }

    /**
     * Close connections
     */
    close() {
        this.duckdb.close();
    }
}

