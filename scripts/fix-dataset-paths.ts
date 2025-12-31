import prisma from "../lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function fixDatasetPaths() {
    console.log("--- Fixing Dataset Paths ---");

    const datasets = await prisma.dataset.findMany({
        where: {
            status: { in: ["READY", "CLEANED"] }
        }
    });

    console.log(`Found ${datasets.length} datasets to check`);

    for (const dataset of datasets) {
        console.log(`\nChecking: ${dataset.name} (${dataset.id})`);
        console.log(`Current rawFileLocation: "${dataset.rawFileLocation}"`);

        // Check if rawFileLocation is empty or invalid
        if (!dataset.rawFileLocation || dataset.rawFileLocation === "") {
            console.log("  ❌ Empty rawFileLocation, attempting to find file...");

            // Look for parquet file in datasets folder
            const datasetDir = path.join("data/uploads/datasets", dataset.id);
            const versionsDir = path.join(datasetDir, "versions");

            if (fs.existsSync(versionsDir)) {
                const files = fs.readdirSync(versionsDir);
                const parquetFiles = files.filter(f => f.endsWith(".parquet"));

                if (parquetFiles.length > 0) {
                    // Use the latest version
                    const latestFile = parquetFiles.sort().reverse()[0];
                    const newLocation = `datasets/${dataset.id}/versions/${latestFile}`;

                    console.log(`  ✅ Found: ${newLocation}`);

                    await prisma.dataset.update({
                        where: { id: dataset.id },
                        data: { rawFileLocation: newLocation }
                    });

                    console.log(`  ✅ Updated!`);
                } else {
                    console.log(`  ⚠️  No parquet files found in ${versionsDir}`);
                }
            } else {
                console.log(`  ⚠️  Versions directory not found: ${versionsDir}`);
            }
        } else {
            // Verify the file exists
            const fullPath = path.join("data/uploads", dataset.rawFileLocation);
            if (fs.existsSync(fullPath)) {
                console.log(`  ✅ File exists: ${fullPath}`);
            } else {
                console.log(`  ❌ File NOT found: ${fullPath}`);

                // Try to find it in datasets folder
                const datasetDir = path.join("data/uploads/datasets", dataset.id);
                const versionsDir = path.join(datasetDir, "versions");

                if (fs.existsSync(versionsDir)) {
                    const files = fs.readdirSync(versionsDir);
                    const parquetFiles = files.filter(f => f.endsWith(".parquet"));

                    if (parquetFiles.length > 0) {
                        const latestFile = parquetFiles.sort().reverse()[0];
                        const newLocation = `datasets/${dataset.id}/versions/${latestFile}`;

                        console.log(`  ✅ Found alternative: ${newLocation}`);

                        await prisma.dataset.update({
                            where: { id: dataset.id },
                            data: { rawFileLocation: newLocation }
                        });

                        console.log(`  ✅ Updated!`);
                    }
                }
            }
        }
    }

    console.log("\n--- Summary ---");
    const updatedDatasets = await prisma.dataset.findMany({
        where: {
            status: { in: ["READY", "CLEANED"] },
            rawFileLocation: { not: "" }
        }
    });
    console.log(`${updatedDatasets.length} datasets now have valid paths`);
}

fixDatasetPaths()
    .then(() => console.log("\n✅ Done!"))
    .catch(err => console.error("Error:", err));
