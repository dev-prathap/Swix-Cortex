import { NLQueryEngine } from "../lib/query/nl-query-engine";
import prisma from "../lib/prisma";
import "dotenv/config";

async function testMultiAgent() {
    console.log("🤖 Testing Multi-Agent System\n");

    const nlEngine = new NLQueryEngine();

    // Get a dataset
    const dataset = await prisma.dataset.findFirst({
        where: {
            status: { in: ["READY", "CLEANED"] },
            rawFileLocation: { not: "" }
        }
    });

    if (!dataset) {
        console.log("❌ No dataset found");
        return;
    }

    console.log(`📊 Dataset: ${dataset.name}`);
    console.log(`👤 User: ${dataset.userId}`);

    const query = "Show me 5 products";
    console.log(`❓ Query: "${query}"\n`);
    console.log("🔄 Orchestrating agents...\n");

    try {
        const result = await nlEngine.executeQuery(dataset.id, dataset.userId, query);

        console.log("\n✅ Multi-Agent Analysis Complete!\n");
        console.log("--- Explanation ---");
        console.log(result.explanation);

        console.log("\n--- Data Sample ---");
        console.log(JSON.stringify(result.data.slice(0, 3), (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

        if (result.visualization) {
            console.log("\n--- Visualization ---");
            console.log(`Type: ${result.visualization.type}`);
            console.log(`Title: ${result.visualization.title}`);
        }

        if (result.forecast) {
            console.log("\n--- Forecast ---");
            console.log(result.forecast);
        }

        if (result.anomalies) {
            console.log("\n--- Anomalies ---");
            console.log(result.anomalies);
        }

    } catch (error: any) {
        console.error("❌ Multi-Agent failed:", error.message);
        console.error(error);
    }
}

testMultiAgent();
