import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
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
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const cookieStore = await cookies();
    const savedState = cookieStore.get("shopify_auth_state")?.value;

    if (!state || state !== savedState) {
        return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
    }

    if (!shop || !code) {
        return NextResponse.json({ error: "Missing shop or code" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const clientId = process.env.SHOPIFY_CLIENT_ID || "YOUR_SHOPIFY_CLIENT_ID";
        const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || "YOUR_SHOPIFY_CLIENT_SECRET";

        // Exchange code for access token
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error("Failed to get access token");
        }

        // Save data source
        await (prisma as any).dataSource.create({
            data: {
                userId,
                name: `Shopify: ${shop.split(".")[0]}`,
                type: "SHOPIFY",
                connectionDetails: JSON.stringify({
                    shop,
                    accessToken: tokenData.access_token,
                    scopes: tokenData.scope,
                }),
                status: "ACTIVE",
            },
        });

        // Redirect back to dashboard
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?connected=shopify`);
    } catch (error) {
        console.error("Shopify OAuth Error:", error);
        return NextResponse.json({ error: "Failed to complete Shopify connection" }, { status: 500 });
    }
}
