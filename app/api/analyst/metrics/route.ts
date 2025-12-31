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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get("datasetId");

    if (!datasetId) return NextResponse.json({ error: "datasetId is required" }, { status: 400 });

    try {
        const metrics = await prisma.metricDefinition.findMany({
            where: { datasetId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(metrics);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { datasetId, name, formula, description, format, category } = await req.json();

        if (!datasetId || !name || !formula) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const metric = await prisma.metricDefinition.create({
            data: {
                datasetId,
                name,
                formula,
                description,
                format: format || "number",
                category,
            },
        });

        return NextResponse.json(metric);
    } catch (error) {
        console.error("Metric creation error:", error);
        return NextResponse.json({ error: "Failed to create metric" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    try {
        await prisma.metricDefinition.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete metric" }, { status: 500 });
    }
}
