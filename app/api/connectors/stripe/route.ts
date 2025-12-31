import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { StripeConnector } from "@/lib/connectors/stripe-connector";

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
        const { name, apiKey } = await req.json();

        if (!name || !apiKey) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify connection
        const connector = new StripeConnector(apiKey);
        const charges = await connector.fetchCharges(1);

        if (!charges) {
            return NextResponse.json({ error: "Failed to connect to Stripe" }, { status: 400 });
        }

        const dataSource = await prisma.dataSource.create({
            data: {
                userId,
                name,
                type: "STRIPE",
                connectionDetails: JSON.stringify({ apiKey }),
                status: "ACTIVE",
            },
        });

        return NextResponse.json(dataSource);
    } catch (error) {
        console.error("Stripe connection error:", error);
        return NextResponse.json({ error: "Failed to connect Stripe" }, { status: 500 });
    }
}
