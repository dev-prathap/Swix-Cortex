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

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { datasetId, title, type } = await req.json();

        if (!datasetId || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // In a real app, we would use a library like 'puppeteer' or 'react-pdf'
        // For now, we simulate report generation
        const report = await prisma.report.create({
            data: {
                userId,
                datasetId,
                title,
                type: type || "executive",
                format: "pdf",
                description: `Automated ${type || "executive"} report for dataset.`,
            },
        });

        return NextResponse.json({
            message: "Report generation started",
            reportId: report.id,
            downloadUrl: `/api/reports/download?id=${report.id}`
        });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
