import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SyncService } from "@/lib/sync/sync-service";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-this-in-prod",
);

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log("[Sync API] Received sync request");
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const syncService = new SyncService();
        // We run this asynchronously to not block the response
        // In a real production app, this would be a background job (BullMQ/Redis)
        syncService.syncDataSource(id).catch(err => {
            console.error(`Background sync failed for ${id}:`, err);
        });

        return NextResponse.json({ message: "Sync started" });
    } catch (error) {
        console.error("Sync trigger error:", error);
        return NextResponse.json({ error: "Failed to start sync" }, { status: 500 });
    }
}
