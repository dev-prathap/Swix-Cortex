import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
        return NextResponse.json({ error: "Shop URL is required" }, { status: 400 });
    }

    // Clean shop URL
    const shopUrl = shop.replace("https://", "").replace("http://", "").split("/")[0];

    const clientId = process.env.SHOPIFY_CLIENT_ID || "YOUR_SHOPIFY_CLIENT_ID";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/shopify/callback`;
    const scopes = "read_products,read_orders,read_customers";

    // Generate a random state for security
    const state = Math.random().toString(36).substring(7);

    // Store state in cookie to verify in callback
    const cookieStore = await cookies();
    cookieStore.set("shopify_auth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10 // 10 minutes
    });

    const authUrl = `https://${shopUrl}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    return NextResponse.redirect(authUrl);
}
