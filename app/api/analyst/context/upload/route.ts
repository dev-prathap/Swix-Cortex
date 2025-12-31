import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ContextManager } from "@/lib/services/context-manager";

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

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const datasetId = formData.get("datasetId") as string | null;

        if (!file || !datasetId) {
            return NextResponse.json({ error: "File and datasetId are required" }, { status: 400 });
        }

        // Verify dataset ownership
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        const text = await file.text();
        const contextManager = new ContextManager();

        await contextManager.ingestDocument(datasetId, text, {
            fileName: file.name,
            uploadedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: "Document ingested into Business Brain successfully.",
        });
    } catch (error) {
        console.error("Context upload error:", error);
        return NextResponse.json({ error: "Failed to upload context document" }, { status: 500 });
    }
}
