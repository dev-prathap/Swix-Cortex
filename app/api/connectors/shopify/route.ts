import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ShopifyConnector } from "@/lib/connectors/shopify-connector";

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
        const { name, shopName, accessToken } = await req.json();

        if (!name || !shopName || !accessToken) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify connection
        const connector = new ShopifyConnector(shopName, accessToken);
        const shopInfo = await connector.getShopInfo();

        if (!shopInfo) {
            return NextResponse.json({ error: "Failed to connect to Shopify" }, { status: 400 });
        }

        const dataSource = await (prisma as any).dataSource.create({
            data: {
                userId,
                name,
                type: "SHOPIFY",
                connectionDetails: JSON.stringify({ shopName, accessToken }),
                status: "ACTIVE",
            },
        });

        return NextResponse.json(dataSource);
    } catch (error) {
        console.error("Shopify connection error:", error);
        return NextResponse.json({ error: "Failed to connect Shopify" }, { status: 500 });
    }
}
