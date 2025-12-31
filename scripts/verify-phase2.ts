import { DuckDBEngine } from "../lib/data/duckdb-engine";
import * as fs from "fs";
import * as path from "path";

async function verifyPhase2() {
    console.log("🚀 Starting Phase 2 Verification: Semantic Layer...");

    const duckdb = new DuckDBEngine();
    const testCsvPath = path.join(process.cwd(), "test_metrics.csv");

    // 1. Create a test CSV
    const csvContent = "id,revenue,cost,category\n1,100,50,A\n2,200,80,B\n3,150,60,A";
    fs.writeFileSync(testCsvPath, csvContent);

    try {
        // 2. Define a metric map (simulating Metric Store)
        const metricMap = {
            "Gross Profit": "SUM(revenue - cost)"
        };

        // 3. Simulate an interpretation that uses the metric
        const interpretation = {
            intent: "comparison",
            metrics: ["Gross Profit"],
            dimensions: ["category"],
            aggregation: "SUM"
        };

        console.log("Testing formula substitution for 'Gross Profit'...");
        const results = await duckdb.executeInterpretation(testCsvPath, interpretation, metricMap);

        console.log("--- Results ---");
        console.table(results);

        // 4. Verify results
        // Category A: (100-50) + (150-60) = 50 + 90 = 140
        // Category B: (200-80) = 120
        const catA = results.find(r => r.name === 'A')?.value;
        const catB = results.find(r => r.name === 'B')?.value;

        if (catA === 140 && catB === 120) {
            console.log("✅ Phase 2 Verification Passed: Formula substitution is accurate!");
        } else {
            console.error(`❌ Phase 2 Verification Failed: Expected 140 and 120, got ${catA} and ${catB}`);
        }

    } catch (error) {
        console.error("❌ Verification Error:", error);
    } finally {
        duckdb.close();
        if (fs.existsSync(testCsvPath)) fs.unlinkSync(testCsvPath);
    }
}

verifyPhase2();
