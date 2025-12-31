import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        const cookieStore = await cookies();
        const isDemoMode = cookieStore.get("swix_demo_mode")?.value === "true";

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
            return NextResponse.json({ customers: [], total: 0 });
        }

        const duckdb = new DuckDBEngine();
        let allCustomers: any[] = [];
        let totalCount = 0;

        for (const dataset of datasets) {
            const filePath = getLocalFilePath(dataset.rawFileLocation);
            try {
                const columns = await duckdb.getSchema(filePath);
                const columnNames = columns.map(c => c.column_name);

                if (!columnNames.includes('_type')) continue;

                // Build query based on available columns
                const hasEmail = columnNames.includes('email');
                const hasTotalSpent = columnNames.includes('total_spent');
                const hasOrdersCount = columnNames.includes('orders_count');
                const hasCity = columnNames.includes('city');
                const hasCustomerName = columnNames.includes('customer_name');

                // Get total count for this dataset
                const isOrderAggregation = hasCustomerName && !hasTotalSpent && columnNames.includes('amount');
                const countQuery = `SELECT COUNT(DISTINCT ${isOrderAggregation ? 'customer_name' : '*'}) as count FROM {{readFunction}} WHERE _type = ${isOrderAggregation ? "'order'" : "'customer'"}`;
                const countResult = await duckdb.query(filePath, countQuery);
                totalCount += Number(countResult[0]?.count || 0);

                let query = "";
                if (isOrderAggregation) {
                    query = `
                        SELECT 
                            customer_name as name,
                            'N/A' as email,
                            SUM(CAST(amount AS DOUBLE)) as total_spent,
                            COUNT(*) as orders_count,
                            'Unknown' as city
                        FROM {{readFunction}} 
                        WHERE _type = 'order'
                        GROUP BY customer_name
                        ORDER BY total_spent DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                } else {
                    query = `
                        SELECT 
                            ${hasCustomerName ? 'customer_name' : "'Anonymous'"} as name,
                            ${hasEmail ? 'email' : "'N/A'"} as email,
                            ${hasTotalSpent ? 'total_spent' : "'0'"} as total_spent,
                            ${hasOrdersCount ? 'orders_count' : "'0'"} as orders_count,
                            ${hasCity ? 'city' : "'Unknown'"} as city
                        FROM {{readFunction}} 
                        WHERE _type = 'customer'
                        LIMIT ${limit} OFFSET ${offset}
                    `;
                }

                const customers = await duckdb.query(filePath, query);
                allCustomers = [...allCustomers, ...customers];
            } catch (err) {
                console.error("Error fetching customers from dataset:", err);
            }
        }

        // Serialize BigInt to string for JSON compatibility
        const serializedCustomers = JSON.parse(JSON.stringify(allCustomers, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
        ));

        return NextResponse.json({
            customers: serializedCustomers,
            total: totalCount,
            page,
            limit
        });
    } catch (error: any) {
        console.error("Customers API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
