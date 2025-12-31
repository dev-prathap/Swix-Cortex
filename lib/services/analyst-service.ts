import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import prisma from "@/lib/prisma";
import { DuckDBEngine, getLocalFilePath } from "../data/duckdb-engine";
import { ContextManager } from "./context-manager";

export interface AnalysisResult {
    answer: string;
    sql: string;
    data: any[];
    chartType?: "bar" | "line" | "pie" | "table";
    suggestedQuestions?: string[];
}

export class AnalystService {
    private duckdb: DuckDBEngine;
    private contextManager: ContextManager;
    private client: any;
    private model: string;

    constructor() {
        this.duckdb = new DuckDBEngine();
        this.contextManager = new ContextManager();
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }

    async analyze(userId: string, datasetId: string, query: string): Promise<AnalysisResult> {
        // 1. Get Dataset Info
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId, userId },
            include: { metrics: true }
        });

        if (!dataset) {
            throw new Error("Dataset not found or unauthorized");
        }

        const filePath = getLocalFilePath(dataset.rawFileLocation.replace('.json', '.parquet').replace('.csv', '.parquet'));

        // 2. Get Schema
        const schema = await this.duckdb.getSchema(filePath);
        const schemaString = schema.map(c => `${c.column_name} (${c.column_type})`).join(", ");

        // 3. Get Business Context
        const businessContext = await this.contextManager.getRelevantContext(datasetId, query) as any[];
        const contextString = businessContext.map((c: any) => c.content).join("\n");

        // 4. Get Metrics
        const metricsString = dataset.metrics.map(m => `${m.name}: ${m.formula} (${m.description || ""})`).join("\n");

        // 5. Generate SQL and Interpretation using LLM
        const systemPrompt = `You are an expert Data Analyst for Swix Cortex using DuckDB SQL.

DATABASE SCHEMA:
Table name: '{{readFunction}}' (This is a placeholder, use it exactly as '{{readFunction}}')
Columns: ${schemaString}

METRIC DEFINITIONS (Use these formulas if applicable):
${metricsString || "No custom metrics defined"}

BUSINESS CONTEXT:
${contextString || "No additional context"}

CRITICAL DUCKDB SQL RULES:
1. Always use '{{readFunction}}' as the table name.
2. For date operations, use: CURRENT_DATE - INTERVAL '30 days' (NOT DATE_SUB)
3. For string matching, use LIKE or ILIKE (case-insensitive)
4. Column names are case-sensitive, wrap in double quotes if needed
5. Use UNNEST() for nested arrays
6. Keep queries simple and efficient
7. Avoid complex subqueries unless absolutely necessary

RESPONSE FORMAT:
Return JSON with these exact keys:
{
  "sql": "The DuckDB SQL query",
  "explanation": "Brief explanation of what the query does",
  "chartType": "bar" | "line" | "pie" | "table",
  "suggestedQuestions": ["question1", "question2", "question3"]
}

Example:
{
  "sql": "SELECT title, price FROM {{readFunction}} LIMIT 5",
  "explanation": "Showing the first 5 products with their titles and prices",
  "chartType": "table",
  "suggestedQuestions": ["What are the most expensive products?", "Group by product type", "Show products by vendor"]
}`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" }
        });

        const llmResult = safeParseJson(response.choices[0].message.content || "{}", {} as any);

        // 6. Execute SQL
        let data: any[] = [];
        try {
            data = await this.duckdb.query(filePath, llmResult.sql);
        } catch (error) {
            console.error("[AnalystService] SQL Execution failed:", error);
            throw new Error("Failed to execute the generated SQL query.");
        }

        // 7. Final Answer Generation (Optional: could use LLM again to summarize data)
        const finalAnswerPrompt = `The user asked: "${query}"
The data retrieved is: ${JSON.stringify(data.slice(0, 10), (_, v) => typeof v === 'bigint' ? v.toString() : v)}
The explanation was: ${llmResult.explanation}

Provide a concise, professional answer to the user based on this data.`;

        const finalAnswerResponse = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: "You are a helpful business analyst." },
                { role: "user", content: finalAnswerPrompt }
            ]
        });

        return {
            answer: finalAnswerResponse.choices[0].message.content || llmResult.explanation,
            sql: llmResult.sql,
            data: data,
            chartType: llmResult.chartType,
            suggestedQuestions: llmResult.suggestedQuestions
        };
    }
}
