import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

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

export async function DELETE(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get("datasetId");
    const fileName = searchParams.get("fileName");

    if (!datasetId || !fileName) {
        return NextResponse.json({ error: "datasetId and fileName are required" }, { status: 400 });
    }

    try {
        // Verify dataset ownership
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId, userId }
        });

        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        // Delete all chunks associated with this fileName in metadata
        await (prisma as any).documentChunk.deleteMany({
            where: {
                datasetId,
                metadata: {
                    path: ['fileName'],
                    equals: fileName
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Context delete error:", error);
        return NextResponse.json({ error: "Failed to delete context document" }, { status: 500 });
    }
}
