import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { DemoService } from "@/lib/services/demo-service";

export async function POST() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const demoService = new DemoService();
        const dataset = await demoService.setupDemoData(userId);

        return NextResponse.json({
            success: true,
            datasetId: dataset.id,
            message: "Demo store setup successfully"
        });
    } catch (error) {
        console.error("Failed to setup demo data:", error);
        return NextResponse.json(
            { error: "Failed to setup demo data" },
            { status: 500 }
        );
    }
}
