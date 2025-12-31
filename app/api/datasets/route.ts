import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-this-in-prod"
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

export async function GET() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const datasets = await prisma.dataset.findMany({
            where: { userId },
            orderBy: { uploadedAt: "desc" },
        });

        // Serialize with BigInt support
        const safeDatasets = JSON.parse(
            JSON.stringify(datasets, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return NextResponse.json(safeDatasets);
    } catch (error) {
        console.error("Failed to fetch datasets:", error);
        return NextResponse.json(
            { error: "Failed to fetch datasets" },
            { status: 500 }
        );
    }
}
