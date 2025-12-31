import { AnalystService } from "../lib/ai/analyst-service";
import prisma from "../lib/prisma";
import "dotenv/config";

async function testAnalystSimple() {
    console.log("--- Testing Analyst Service (Simple) ---\n");

    const analyst = new AnalystService();

    // Get a dataset with a valid parquet file
    const dataset = await prisma.dataset.findFirst({
        where: {
            status: { in: ["READY", "CLEANED"] },
            rawFileLocation: { contains: ".parquet" }
        }
    });

    if (!dataset) {
        console.log("❌ No parquet dataset found to test with.");
        return;
    }

    const userId = dataset.userId;
    const datasetId = dataset.id;

    console.log(`📊 Dataset: ${dataset.name}`);
    console.log(`📁 File: ${dataset.rawFileLocation}\n`);

    // Simple query
    const query = "Show me the first 5 rows of data";

    console.log(`❓ Query: "${query}"\n`);
    console.log("🤖 AI is thinking...\n");

    try {
        const result = await analyst.analyze(userId, datasetId, query);

        console.log("✅ Analysis Complete!\n");
        console.log("--- Answer ---");
        console.log(result.answer);
        console.log("\n--- SQL Generated ---");
        console.log(result.sql);
        console.log("\n--- Chart Type ---");
        console.log(result.chartType);
        console.log("\n--- Data Sample (first 3 rows) ---");
        console.log(JSON.stringify(result.data.slice(0, 3), (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
        console.log("\n--- Suggested Questions ---");
        console.log(result.suggestedQuestions);

    } catch (error: any) {
        console.error("❌ Analysis failed:", error.message);
        console.error(error);
    }
}

testAnalystSimple();
