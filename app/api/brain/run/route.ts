import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { BrainService } from "@/lib/services/brain-service";

export async function POST() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const brainService = new BrainService();
        const insights = await brainService.runDailyAnalysis(userId);

        return NextResponse.json({
            success: true,
            message: "Brain run completed successfully",
            insightsCount: insights?.length || 0
        });
    } catch (error) {
        console.error("Brain run failed:", error);
        return NextResponse.json(
            { error: "Failed to run brain analysis" },
            { status: 500 }
        );
    }
}
