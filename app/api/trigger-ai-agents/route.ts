import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

/**
 * Manual trigger endpoint for AI agents
 * Can be called from frontend to immediately run AI processing
 */
export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[TriggerAI] Manual trigger requested by user:", userId);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const cronSecret = process.env.CRON_SECRET || "dev-secret-change-in-production";

        // Trigger the master cron job
        const response = await fetch(`${baseUrl}/api/cron/run-all-agents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-call": "true",
                "authorization": `Bearer ${cronSecret}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to trigger AI agents: ${response.statusText}`);
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            message: "AI agents triggered successfully",
            ...result
        });

    } catch (error: any) {
        console.error("[TriggerAI] Error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

