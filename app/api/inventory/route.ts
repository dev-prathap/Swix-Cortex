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
                status: { in: ["READY", "CLEANED"] },
                rawFileLocation: { not: "" },
                isDemo: isDemoMode
            } as any,
            orderBy: { uploadedAt: 'desc' }
        });

        if (datasets.length === 0) {
            return NextResponse.json({ products: [], total: 0 });
        }

        const duckdb = new DuckDBEngine();
        let allProducts: any[] = [];
        let totalCount = 0;

        for (const dataset of datasets) {
            const filePath = getLocalFilePath(dataset.rawFileLocation);
            try {
                const columns = await duckdb.getSchema(filePath);
                const columnNames = columns.map(c => c.column_name);

                if (!columnNames.includes('_type')) continue;

                // Build query based on available columns
                const hasProductName = columnNames.includes('product_name') || columnNames.includes('name');
                const hasSku = columnNames.includes('sku');
                const hasStock = columnNames.includes('stock') || columnNames.includes('inventory_quantity');
                const hasPrice = columnNames.includes('price') || columnNames.includes('amount');
                const hasCategory = columnNames.includes('category');

                // Get total count for this dataset
                const countQuery = `SELECT COUNT(*) as count FROM {{readFunction}} WHERE _type = 'product'`;
                const countResult = await duckdb.query(filePath, countQuery);
                totalCount += Number(countResult[0]?.count || 0);

                const query = `
                    SELECT 
                        ${hasProductName ? (columnNames.includes('product_name') ? 'product_name' : 'name') : "'Unknown Product'"} as name,
                        ${hasSku ? 'sku' : "'N/A'"} as sku,
                        ${hasStock ? (columnNames.includes('stock') ? 'stock' : 'inventory_quantity') : "0"} as stock,
                        ${hasPrice ? (columnNames.includes('price') ? 'price' : 'amount') : "0"} as price,
                        ${hasCategory ? 'category' : "'Uncategorized'"} as category
                    FROM {{readFunction}} 
                    WHERE _type = 'product'
                    LIMIT ${limit} OFFSET ${offset}
                `;

                const products = await duckdb.query(filePath, query);
                allProducts = [...allProducts, ...products];
            } catch (err) {
                console.error("Error fetching products from dataset:", err);
            }
        }

        // Serialize BigInt to string for JSON compatibility
        const serializedProducts = JSON.parse(JSON.stringify(allProducts, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
        ));

        return NextResponse.json({
            products: serializedProducts,
            total: totalCount,
            page,
            limit
        });
    } catch (error: any) {
        console.error("Inventory API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
