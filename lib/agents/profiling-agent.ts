import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { ObjectStorage } from "@/lib/storage/object-storage";
import Papa from "papaparse";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

const PROFILING_SYSTEM_PROMPT = `
You are an expert human-like data analyst.

You receive:
- Column names
- Sample rows
- Basic file metadata

Your job is to PROFILE the dataset and return STRICT JSON with:
- domain: high-level business domain (e.g. "sales", "finance", "healthcare", "logs")
- main_entity: what each row represents (e.g. "transaction", "order", "claim")
- time_column: name of the most important time column (or null)
- metrics: array of metric field names (numeric measures)
- dimensions: array of dimension field names (categorical for grouping)
- issues: {
    missing_values: [column names],
    mixed_formats: [column names],
    outliers: [column names]
  }
- data_quality_score: number between 0 and 1
- confidence: number between 0 and 1

Think like a human consultant. Consider both column names and sample values.
Return ONLY a JSON object, no explanation text.
`;

export class ProfilingAgent {
  private objectStorage = new ObjectStorage();

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
      approxRows: Number(dataset.fileSize) > 0 ? undefined : undefined,
    };

    // Serialize with BigInt support (convert BigInt to string)
    const userPrompt = JSON.stringify(sample, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    , 2);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
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


