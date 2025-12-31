import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import prisma from "@/lib/prisma";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";
import { normalizeChartData } from "@/lib/utils/normalizeChartData";

export class AnalystAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }
    private systemPrompt = `You are the Lead Data Architect and SQL Expert for Swix Cortex.
Your role is to translate natural language business questions into precise, executable analysis plans using DuckDB SQL.

### Your Capabilities:
1.  **Intent Recognition:** accurately identify if the user wants a summary, trend, comparison, ranking, or distribution.
2.  **Schema Intelligence:** You understand the provided dataset schema (metrics, dimensions) and map vague terms to specific columns (e.g., "revenue" -> "total_sales", "clients" -> "customer_name").
3.  **DuckDB Mastery:** You utilize DuckDB's advanced features (date_trunc, window functions, aggregations) for efficient analysis.

### Output Schema (Strict JSON):
You must return a JSON object with the following structure:
{
  "intent": "summary" | "trend" | "comparison" | "ranking" | "distribution",
  "metrics": ["col_name1", "col_name2"], // The exact column names to aggregate
  "dimensions": ["col_name3"], // The exact column names to group by
  "aggregation": "SUM" | "AVG" | "COUNT" | "MIN" | "MAX", // Primary aggregation method
  "filters": [ // Optional filters
    { "column": "col_name", "operator": "=" | ">" | "<" | "LIKE", "value": "..." }
  ],
  "time_dimension": "col_name" | null, // If a time-based analysis, specify the date column
  "limit": number | null, // For top N queries
  "reasoning": "Brief explanation of why you chose this plan."
}

### Guidelines for Accuracy:
1.  **Ambiguity Resolution:** If the user asks for "best products", assume they mean by Sales Volume or Revenue unless specified otherwise.
2.  **Date Handling:** When analyzing trends, always try to group by a time dimension (e.g., month, week) if a date column exists.
3.  **Metric Matching:** Check the "Metric Store" provided in the context. If a user term matches a known metric key, use the associated column.
4.  **Safety:** Do NOT generate SQL that modifies data (UPDATE, DELETE). Only SELECT.

### Example:
*   *Query:* "Top 5 customers by revenue last month"
*   *Output:*
    {
      "intent": "ranking",
      "metrics": ["total_spent"],
      "dimensions": ["customer_name"],
      "aggregation": "SUM",
      "filters": [{ "column": "order_date", "operator": ">", "value": "2023-11-01" }],
      "time_dimension": "order_date",
      "limit": 5,
      "reasoning": "Grouping by customer name and summing total spent to find top performers."
    }
`;

    async analyze(
        query: string,
        dataset: any,
        metricMap: Record<string, string>
    ): Promise<{ interpretation: any; data: any[]; realtimeContext?: string }> {
        const profile = dataset.profile;

        // Fetch Real-time events if this dataset is linked to a DataSource
        let dataSourceId = dataset.dataSourceId;

        // Fallback to name matching if no explicit link exists
        if (!dataSourceId) {
            const dataSource = await (prisma as any).dataSource.findFirst({
                where: { userId: dataset.userId, name: { contains: dataset.name.replace(" Sync", "") } }
            });
            if (dataSource) dataSourceId = dataSource.id;
        }

        let realtimeEvents: any[] = [];
        if (dataSourceId) {
            realtimeEvents = await (prisma as any).realtimeEvent.findMany({
                where: { dataSourceId: dataSourceId, processed: false },
                take: 50,
                orderBy: { createdAt: 'desc' }
            });
        }

        const prompt = `
Dataset: ${dataset.name}
Metrics: ${JSON.stringify(profile.metrics)}
Dimensions: ${JSON.stringify(profile.dimensions)}
Metric Store: ${JSON.stringify(Object.keys(metricMap))}

REAL-TIME EVENTS (Last 50 unprocessed):
${JSON.stringify(realtimeEvents)}

Query: "${query}"`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const interpretation = safeParseJson(response.choices[0].message.content || "{}", {});

        // Execute using DuckDB
        const filePath = getLocalFilePath(dataset.rawFileLocation);
        const duckdb = new DuckDBEngine();

        try {
            const rawData = await duckdb.executeInterpretation(filePath, interpretation, metricMap);
            duckdb.close();

            const normalizedData = normalizeChartData(rawData, interpretation);
            return {
                interpretation,
                data: normalizedData,
                realtimeContext: realtimeEvents.length > 0 ? `Note: Including ${realtimeEvents.length} new real-time events received since last sync.` : undefined
            };
        } catch (error) {
            duckdb.close();
            throw error;
        }
    }
}
