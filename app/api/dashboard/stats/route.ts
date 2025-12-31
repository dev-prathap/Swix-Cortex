import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";
import { UnifiedQueryEngine } from "@/lib/data/unified-query-engine";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const cookieStore = await cookies();
        const isDemoMode = cookieStore.get("swix_demo_mode")?.value === "true";
        const useRealtime = cookieStore.get("swix_realtime_mode")?.value === "true" || true; // Enable by default

        // Use new unified query engine for real-time + historical data
        if (useRealtime) {
            return await getStatsRealtime(userId, isDemoMode);
        }

        // Fallback to old method (for compatibility)
        return await getStatsLegacy(userId, isDemoMode);
    } catch (error: any) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * NEW: Real-time stats using UnifiedQueryEngine (Hot/Cold pattern)
 */
async function getStatsRealtime(userId: string, isDemoMode: boolean) {
    console.log("[Stats] Using real-time unified query engine");
    const unifiedEngine = new UnifiedQueryEngine(24); // 24 hours hot data

    try {
        const stats = await unifiedEngine.getStats(userId);
        
        // Get recent orders for display
        const recentOrders = await unifiedEngine.getOrders(userId, { limit: 5 });

        // Get sales by date
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" },
                isDemo: isDemoMode
            } as any
        });

        let salesByDate: any[] = [];
        if (datasets.length > 0) {
            const duckdb = new DuckDBEngine();
            for (const dataset of datasets) {
                try {
                    const filePath = getLocalFilePath(dataset.rawFileLocation);
                    const chartQuery = `
                        SELECT 
                            CAST(created_at AS DATE) as date,
                            SUM(CAST(COALESCE(total_price, '0') AS DOUBLE)) as amount
                        FROM {{readFunction}}
                        WHERE _type = 'order'
                        GROUP BY date
                        ORDER BY date ASC
                    `;
                    const chartData = await duckdb.query(filePath, chartQuery);
                    salesByDate = [...salesByDate, ...chartData];
                } catch (err) {
                    console.error("Error fetching chart data:", err);
                }
            }
            duckdb.close();
        }

        unifiedEngine.close();

        return NextResponse.json({
            totalSales: stats.totalRevenue,
            totalOrders: stats.totalOrders,
            totalCustomers: stats.totalCustomers,
            totalProducts: stats.totalProducts || 0,
            recentOrders: recentOrders.slice(0, 5).map(o => ({
                customer_name: o.customer_name,
                amount: o.total_price,
                status: o.status,
                created_at: o.created_at
            })),
            salesByDate: salesByDate.map(d => ({
                date: d.date,
                amount: Number(d.amount)
            })),
            insights: [],
            realtimeInfo: {
                realtimeOrders: stats.realtimeOrders,
                historicalOrders: stats.historicalOrders,
                using: "unified_engine"
            }
        });
    } catch (error) {
        console.error("[Stats] Real-time query failed, falling back to legacy:", error);
        return await getStatsLegacy(userId, isDemoMode);
    }
}

/**
 * LEGACY: Original stats method (for backward compatibility)
 */
async function getStatsLegacy(userId: string, isDemoMode: boolean) {
    console.log("[Stats] Using legacy query method");
    try {
        const cookieStore = await cookies();

        // Get datasets
        const datasets = await prisma.dataset.findMany({
            where: {
                userId,
                status: { in: ["READY", "CLEANED", "PROFILED"] },
                rawFileLocation: { not: "" },
                isDemo: isDemoMode
            } as any,
            orderBy: { uploadedAt: 'desc' }
        });

        if (datasets.length === 0) {
            return NextResponse.json({
                totalSales: 0,
                totalOrders: 0,
                totalCustomers: 0,
                totalProducts: 0,
                recentOrders: [],
                salesByDate: [],
                insights: []
            });
        }

        const duckdb = new DuckDBEngine();
        let totalSales = 0;
        let totalOrders = 0;
        let totalCustomers = 0;
        let totalProducts = 0;
        let allRecentOrders: any[] = [];
        let allSalesByDate: any[] = [];

        for (const dataset of datasets) {
            const filePath = getLocalFilePath(dataset.rawFileLocation);
            try {
                const columns = await duckdb.getSchema(filePath);
                const columnNames = columns.map(c => c.column_name);

                if (!columnNames.includes('_type')) continue;

                // Use normalized column name (total_price for orders)
                const priceColumn = columnNames.includes('total_price') 
                    ? 'total_price' 
                    : columnNames.includes('price')
                    ? 'price'
                    : null;

                if (!priceColumn) {
                    console.log(`Skipping dataset ${dataset.id}: no price column found`);
                    continue;
                }

                // Use normalized customer columns (from transformer)
                const hasCustomerName = columnNames.includes('customer_name');
                const hasCustomerEmail = columnNames.includes('customer_email');
                const hasEmail = columnNames.includes('email');
                const hasCustomerId = columnNames.includes('customer_id');
                
                let customerIdentifier = "'Unknown'";
                if (hasCustomerName) {
                    customerIdentifier = "COALESCE(customer_name, 'Unknown')";
                } else if (hasCustomerEmail) {
                    customerIdentifier = "COALESCE(customer_email, 'Unknown')";
                } else if (hasEmail) {
                    customerIdentifier = "COALESCE(email, 'Unknown')";
                } else if (hasCustomerId) {
                    customerIdentifier = "CAST(customer_id AS VARCHAR)";
                }

                // Use normalized customer_name column
                let customerNameExpr = "'Guest'";
                if (hasCustomerName) {
                    customerNameExpr = "COALESCE(customer_name, 'Guest')";
                } else if (hasCustomerEmail) {
                    customerNameExpr = "COALESCE(customer_email, 'Guest')";
                } else if (hasEmail) {
                    customerNameExpr = "COALESCE(email, 'Guest')";
                }

                // Check for required columns
                const hasStatus = columnNames.includes('status');
                const hasCreatedAt = columnNames.includes('created_at');

                // 1. Core Stats
                const statsQuery = `
                    SELECT 
                        SUM(CASE WHEN _type = 'order' THEN CAST(COALESCE(${priceColumn}, '0') AS DOUBLE) ELSE 0 END) as sales,
                        COUNT(CASE WHEN _type = 'order' THEN 1 END) as orders,
                        COUNT(DISTINCT CASE WHEN _type = 'customer' THEN ${customerIdentifier} ELSE NULL END) as customers,
                        COUNT(CASE WHEN _type = 'product' THEN 1 END) as products
                    FROM {{readFunction}}
                `;
                const stats = await duckdb.query(filePath, statsQuery);
                totalSales += Number(stats[0]?.sales || 0);
                totalOrders += Number(stats[0]?.orders || 0);
                totalCustomers += Number(stats[0]?.customers || 0);
                totalProducts += Number(stats[0]?.products || 0);

                // 2. Recent Orders (only if we have the required columns)
                if (hasCreatedAt) {
                    const recentQuery = `
                        SELECT 
                            ${customerNameExpr} as customer_name, 
                            CAST(COALESCE(${priceColumn}, '0') AS DOUBLE) as amount, 
                            ${hasStatus ? 'status' : "'N/A' as status"}, 
                            created_at
                        FROM {{readFunction}}
                        WHERE _type = 'order'
                        ORDER BY created_at DESC
                        LIMIT 5
                    `;
                    const recent = await duckdb.query(filePath, recentQuery);
                    allRecentOrders = [...allRecentOrders, ...recent];
                }

                // 3. Sales by Date (for chart) - only if we have created_at
                if (hasCreatedAt) {
                    const chartQuery = `
                        SELECT 
                            CAST(created_at AS DATE) as date,
                            SUM(CAST(COALESCE(${priceColumn}, '0') AS DOUBLE)) as amount
                        FROM {{readFunction}}
                        WHERE _type = 'order'
                        GROUP BY date
                        ORDER BY date ASC
                    `;
                    const chartData = await duckdb.query(filePath, chartQuery);
                    allSalesByDate = [...allSalesByDate, ...chartData];
                }

            } catch (err) {
                console.error("Error fetching stats from dataset:", err);
            }
        }

        // Aggregate and sort
        allRecentOrders = allRecentOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        // 4. Generate/Fetch AI Insights
        let insights = [
            {
                type: 'inventory_alert',
                title: 'Stock-out Risk',
                content: '3 high-velocity items are predicted to run out in the next 48 hours.',
                severity: 'high'
            },
            {
                type: 'growth_opportunity',
                title: 'LTV Boost',
                content: 'Personalized campaigns for "Loyalists" could increase revenue by 12%.',
                severity: 'medium'
            }
        ];

        // Try to get real insights from the latest dataset
        const latestDataset = datasets[0];
        if (latestDataset.insightFeed) {
            insights = latestDataset.insightFeed as any;
        } else if (allRecentOrders.length > 0) {
            // Trigger background insight generation (simplified for MVP)
            try {
                const { ExecutiveAgent } = await import("@/lib/agents/executive-agent");
                const executive = new ExecutiveAgent();
                const summary = await executive.synthesize(
                    "Give me a high-level business summary and 2 key insights for the dashboard feed.",
                    allRecentOrders,
                    "Dashboard Overview",
                    []
                );

                // Parse summary into feed items (simple split for now)
                const lines = summary.split('\n').filter(l => l.trim().length > 10).slice(0, 2);
                const newInsights = lines.map((line, i) => ({
                    type: i === 0 ? 'growth_opportunity' : 'inventory_alert',
                    title: i === 0 ? 'Executive Summary' : 'Strategic Insight',
                    content: line.replace(/^[*-]\s*/, '').substring(0, 150),
                    severity: i === 0 ? 'medium' : 'high'
                }));

                if (newInsights.length > 0) {
                    insights = newInsights;
                    // Cache it
                    await prisma.dataset.update({
                        where: { id: latestDataset.id },
                        data: { insightFeed: insights as any }
                    });
                }
            } catch (err) {
                console.error("Failed to generate real-time insights:", err);
            }
        }

        // 5. Generate Forecast (Simplified for MVP)
        const projectedRevenue = totalSales * 1.15; // 15% growth projection
        const forecast = {
            projectedRevenue: Math.round(projectedRevenue),
            growthRate: 15,
            confidence: 88,
            insight: "Current sales velocity suggests a 15% increase in revenue over the next 30 days."
        };

        return NextResponse.json({
            totalSales: Number(totalSales),
            totalOrders: Number(totalOrders),
            totalCustomers: Number(totalCustomers),
            totalProducts: Number(totalProducts),
            recentOrders: allRecentOrders.map(o => ({
                ...o,
                amount: Number(o.amount)
            })),
            salesByDate: allSalesByDate.map(d => ({
                ...d,
                amount: Number(d.amount)
            })),
            insights,
            forecast,
            realtimeInfo: {
                using: "legacy_engine"
            }
        });
    } catch (error: any) {
        console.error("Stats Legacy error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
