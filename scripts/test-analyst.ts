import { AnalystService } from "../lib/ai/analyst-service";
import prisma from "../lib/prisma";
import "dotenv/config";

async function testAnalyst() {
    console.log("--- Testing Analyst Service ---");

    const analyst = new AnalystService();

    // Get a real dataset
    const dataset = await prisma.dataset.findFirst();
    if (!dataset) {
        console.log("No dataset found to test with.");
        return;
    }

    const userId = dataset.userId;
    const datasetId = dataset.id;
    const query = "Show me the total sales for each product";

    console.log(`Query: "${query}"`);
    console.log(`Dataset: ${dataset.name}`);

    try {
        const result = await analyst.analyze(userId, datasetId, query);
        console.log("\n--- Analysis Result ---");
        console.log("Answer:", result.answer);
        console.log("SQL:", result.sql);
        console.log("Chart Type:", result.chartType);
        console.log("Data Sample:", result.data.slice(0, 3));
        console.log("Suggested Questions:", result.suggestedQuestions);
    } catch (error) {
        console.error("Analysis failed:", error);
    }
}

testAnalyst();
