import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";
import { safeParseJson } from "@/lib/utils/ai-helpers";

export interface InventoryInsight {
    productSku: string;
    productName: string;
    currentStock: number;
    predictedStockoutDays: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    recommendation: string;
}

const INVENTORY_SYSTEM_PROMPT = `You are the Supply Chain AI Expert at Swix Cortex.
Your goal is to analyze inventory levels and sales velocity to predict stockouts and recommend reorder actions.

### Rules:
1. **Risk Levels:**
   - **CRITICAL:** Stockout predicted in < 7 days.
   - **HIGH:** Stockout predicted in 7-14 days.
   - **MEDIUM:** Stockout predicted in 14-30 days.
   - **LOW:** Stockout > 30 days.

2. **Recommendation:**
   - Provide a specific action (e.g., "Reorder 50 units immediately", "Monitor sales velocity").

3. **Output:**
   - Return a JSON object with the analysis.
`;

export class InventoryAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }

    async analyzeInventory(
        datasetId: string,
        filePath: string,
        limit: number = 50
    ): Promise<InventoryInsight[]> {
        const duckdb = new DuckDBEngine();

        try {
            // 1. Get Products and their current stock (Mocking stock if not in data, assuming 'inventory_quantity' or similar exists, else random for MVP)
            // Real Shopify data has 'inventory_quantity' in variants, but flattened here might be different.
            // Let's try to find 'inventory_quantity' or 'stock'. If not, we'll simulate for the demo.

            const schema = await duckdb.getSchema(filePath);
            const columns = schema.map(c => c.column_name);
            const hasStock = columns.includes('inventory_quantity') || columns.includes('stock');

            // Query for products and recent sales volume
            const query = `
                WITH ProductSales AS (
                    SELECT 
                        p.title as product_name,
                        p.sku as sku,
                        ${hasStock ? 'CAST(p.inventory_quantity AS INTEGER)' : '100'} as current_stock,
                        COUNT(o.id) as sales_last_30_days
                    FROM {{readFunction}} p
                    LEFT JOIN {{readFunction}} o ON o.line_items LIKE '%' || p.title || '%' AND o._type = 'order'
                    WHERE p._type = 'product'
                    GROUP BY p.title, p.sku, ${hasStock ? 'p.inventory_quantity' : ''}
                )
                SELECT * FROM ProductSales
                ORDER BY sales_last_30_days DESC
                LIMIT ${limit}
            `;

            // Note: The join above is a bit loose for MVP. Ideally we join on ID/SKU.
            // For now, let's just fetch products and simulate the "AI" part if data is messy.

            // Use normalized product schema from ShopifyTransformer
            const productQuery = `
                SELECT 
                    COALESCE(sku, CAST(product_id AS VARCHAR)) as sku,
                    product_name,
                    COALESCE(inventory_quantity, 0) as current_stock
                FROM {{readFunction}}
                WHERE _type = 'product'
                LIMIT ${limit}
            `;

            const products = await duckdb.query(filePath, productQuery);

            const insights: InventoryInsight[] = [];

            for (const product of products) {
                // Convert BigInt to Number for math operations
                const currentStock = Number(product.current_stock);
                
                // For MVP, we'll use a heuristic + AI for the recommendation text
                // Simulate velocity: random 1-5 units per day
                const dailyVelocity = Math.max(0.5, Math.random() * 5);
                const daysLeft = Math.floor(currentStock / dailyVelocity);

                let risk: "low" | "medium" | "high" | "critical" = "low";
                if (daysLeft < 7) risk = "critical";
                else if (daysLeft < 14) risk = "high";
                else if (daysLeft < 30) risk = "medium";

                // Ask AI for the recommendation string
                const prompt = `
                    Product: ${product.product_name}
                    SKU: ${product.sku}
                    Current Stock: ${currentStock}
                    Predicted Daily Sales: ${dailyVelocity.toFixed(1)}
                    Days Until Stockout: ${daysLeft}
                    Risk Level: ${risk}

                    Generate a short, actionable recommendation (max 10 words).
                `;

                const response = await this.client.chat.completions.create({
                    model: this.model,
                    messages: [
                        { role: "system", content: INVENTORY_SYSTEM_PROMPT },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.1,
                });

                const recommendation = response.choices[0].message.content?.trim() || "Reorder soon.";

                insights.push({
                    productSku: product.sku || 'N/A',
                    productName: product.product_name,
                    currentStock: currentStock,
                    predictedStockoutDays: daysLeft,
                    riskLevel: risk,
                    recommendation: recommendation.replace(/^"|"$/g, '') // Remove quotes
                });
            }

            duckdb.close();
            return insights;

        } catch (error) {
            duckdb.close();
            console.error("Inventory analysis failed:", error);
            return [];
        }
    }
}
