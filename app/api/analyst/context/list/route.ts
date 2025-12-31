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

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get("datasetId");

    if (!datasetId) {
        return NextResponse.json({ error: "datasetId is required" }, { status: 400 });
    }

    try {
        // Group by metadata -> fileName to show unique documents
        const chunks = await (prisma as any).documentChunk.findMany({
            where: { datasetId },
            select: {
                metadata: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Simple deduplication based on fileName in metadata
        const documents = [];
        const seenFiles = new Set();

        for (const chunk of chunks) {
            const metadata = chunk.metadata as any;
            const fileName = metadata?.fileName || "Unknown Document";

            if (!seenFiles.has(fileName)) {
                documents.push({
                    fileName,
                    createdAt: chunk.createdAt,
                    id: fileName // Using fileName as ID for now
                });
                seenFiles.add(fileName);
            }
        }

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Context list error:", error);
        return NextResponse.json({ error: "Failed to list context documents" }, { status: 500 });
    }
}
