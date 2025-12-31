import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const sources = await prisma.dataSource.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const datasets = await prisma.dataset.findMany({
            orderBy: { uploadedAt: 'desc' },
            take: 5
        });

        return NextResponse.json({
            sources,
            datasets: JSON.parse(JSON.stringify(datasets, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
