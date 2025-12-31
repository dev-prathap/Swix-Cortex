import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { WooCommerceConnector } from "@/lib/connectors/woocommerce-connector";

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
        const { name, url, consumerKey, consumerSecret } = await req.json();

        if (!name || !url || !consumerKey || !consumerSecret) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify connection
        const connector = new WooCommerceConnector(url, consumerKey, consumerSecret);
        const isValid = await connector.verifyConnection();

        if (!isValid) {
            return NextResponse.json({ error: "Failed to connect to WooCommerce. Check credentials and REST API status." }, { status: 400 });
        }

        const dataSource = await (prisma as any).dataSource.create({
            data: {
                userId,
                name,
                type: "WOOCOMMERCE",
                connectionDetails: JSON.stringify({ url, consumerKey, consumerSecret }),
                status: "ACTIVE",
            },
        });

        return NextResponse.json(dataSource);
    } catch (error) {
        console.error("WooCommerce connection error:", error);
        return NextResponse.json({ error: "Failed to connect WooCommerce" }, { status: 500 });
    }
}
