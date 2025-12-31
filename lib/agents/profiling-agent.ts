import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import prisma from "@/lib/prisma";
import { ObjectStorage } from "@/lib/storage/object-storage";
import Papa from "papaparse";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

const PROFILING_SYSTEM_PROMPT = `You are a Senior Data Engineer and Domain Expert specializing in dataset profiling and schema inference.

### Your Mission:
Analyze raw datasets to understand their structure, quality, and business purpose. You will receive column names, sample rows, and file metadata. Your goal is to produce a comprehensive data profile.

### Analysis Dimensions:

1.  **Domain Classification:**
    *   Identify the business domain (e.g., "e-commerce", "finance", "healthcare", "logistics", "SaaS metrics").
    *   Look for domain-specific patterns (e.g., "order_id" + "customer_email" = e-commerce).

2.  **Entity Recognition:**
    *   Determine what each row represents (e.g., "transaction", "user session", "product", "invoice").
    *   Consider the granularity (e.g., daily aggregates vs. individual events).

3.  **Temporal Analysis:**
    *   Identify the primary time column (e.g., "created_at", "order_date", "timestamp").
    *   If multiple date columns exist, choose the one most relevant for trend analysis.

4.  **Metric vs. Dimension Classification:**
    *   **Metrics:** Numeric fields that can be aggregated (SUM, AVG). Examples: "revenue", "quantity", "duration_seconds".
    *   **Dimensions:** Categorical fields for grouping/filtering. Examples: "region", "product_category", "status".
    *   Edge case: IDs are dimensions, not metrics (even if numeric).

5.  **Data Quality Assessment:**
    *   **Missing Values:** Identify columns with null/empty values in the sample.
    *   **Mixed Formats:** Detect inconsistencies (e.g., dates in multiple formats, numbers stored as strings).
    *   **Outliers:** Flag columns with extreme values that might indicate errors.
    *   **Score:** Assign a quality score (0-1) based on completeness, consistency, and validity.

6.  **Confidence Level:**
    *   Rate your confidence (0-1) in this profile based on sample size and clarity of patterns.

### Output Schema (Strict JSON):
{
  "domain": "string (e.g., 'e-commerce', 'finance')",
  "main_entity": "string (e.g., 'order', 'transaction')",
  "time_column": "string | null (the primary date/time column)",
  "metrics": ["array", "of", "numeric", "column", "names"],
  "dimensions": ["array", "of", "categorical", "column", "names"],
  "issues": {
    "missing_values": ["columns", "with", "nulls"],
    "mixed_formats": ["columns", "with", "inconsistent", "formats"],
    "outliers": ["columns", "with", "extreme", "values"]
  },
  "data_quality_score": 0.85,
  "confidence": 0.90
}

### Guidelines:
*   **Inference from Names:** Use column names as strong signals (e.g., "total_price" is likely a metric).
*   **Inference from Values:** Validate with sample data (e.g., if "status" has values like "shipped", "pending", it's a dimension).
*   **Conservative Estimation:** If unsure, default to lower confidence and flag potential issues.

Return ONLY the JSON object. No explanations outside the JSON.
`;

export class ProfilingAgent {
  private objectStorage = new ObjectStorage();
  private client: any;
  private model: string;

  constructor() {
    this.client = getAIClient('fast');
    this.model = getModelName('fast');
  }

  async profileDataset(datasetId: string) {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      throw new Error("Dataset not found");
    }

    // Use DuckDB for fast sampling (much faster than streaming CSV)
    let rows: Record<string, any>[] = [];

    try {
      const filePath = getLocalFilePath(dataset.rawFileLocation);
      const duckdb = new DuckDBEngine();

      // Get sample rows (DuckDB is 10-100x faster than Papa.parse for large files)
      rows = await duckdb.getSample(filePath, 200);

      duckdb.close();
      console.log(`[Profiling] Sampled ${rows.length} rows using DuckDB`);
    } catch (error) {
      console.error('[Profiling] DuckDB sampling failed, falling back to CSV parser:', error);

      // Fallback to CSV parser
      const stream = await this.objectStorage.downloadRaw(dataset.rawFileLocation);
      rows = await new Promise((resolve, reject) => {
        const collected: Record<string, any>[] = [];
        let rowCount = 0;
        const maxRows = 200;

        Papa.parse(stream as any, {
          header: true,
          skipEmptyLines: true,
          step: (result: Papa.ParseResult<any>, parser: Papa.Parser) => {
            if (result.data) {
              collected.push(result.data as Record<string, any>);
              rowCount += 1;
            }
            if (rowCount >= maxRows) {
              parser.abort();
            }
          },
          complete: () => resolve(collected),
          error: (err) => reject(err),
        });
      });
    }

    if (!rows.length) {
      throw new Error("No rows found in dataset sample");
    }

    const sample = {
      columns: Object.keys(rows[0]),
      rows: rows.slice(0, 50),
      fileName: dataset.originalFileName,
    };

    // Serialize with BigInt support (convert BigInt to string)
    const userPrompt = JSON.stringify(sample, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
      , 2);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PROFILING_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty profiling response from AI");
    }

    const parsed = safeParseJson(content, {} as any);
    if (!parsed || Object.keys(parsed).length === 0) {
      throw new Error("Failed to parse profiling JSON from AI");
    }

    const profile = await prisma.dataProfile.upsert({
      where: { datasetId: dataset.id },
      update: {
        domain: parsed.domain ?? "unknown",
        mainEntity: parsed.main_entity ?? "row",
        timeColumn: parsed.time_column ?? null,
        metrics: parsed.metrics ?? [],
        dimensions: parsed.dimensions ?? [],
        dataQualityScore: parsed.data_quality_score ?? 0.5,
        issues: parsed.issues ?? {},
        confidence: parsed.confidence ?? 0.5,
      },
      create: {
        datasetId: dataset.id,
        domain: parsed.domain ?? "unknown",
        mainEntity: parsed.main_entity ?? "row",
        timeColumn: parsed.time_column ?? null,
        metrics: parsed.metrics ?? [],
        dimensions: parsed.dimensions ?? [],
        dataQualityScore: parsed.data_quality_score ?? 0.5,
        issues: parsed.issues ?? {},
        confidence: parsed.confidence ?? 0.5,
      },
    });

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { status: "PROFILED" },
    });

    return profile;
  }
}


