import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

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
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Store URL is required" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean URL
    let storeUrl = url.trim();
    if (!storeUrl.startsWith("http")) {
        storeUrl = `https://${storeUrl}`;
    }
    storeUrl = storeUrl.replace(/\/$/, "");

    const appName = "Swix Cortex";
    const scope = "read_write";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/dashboard?connected=woocommerce`;
    const callbackUrl = `${appUrl}/api/auth/woocommerce/callback`;

    const authUrl = `${storeUrl}/wc-auth/v1/authorize?app_name=${encodeURIComponent(appName)}&scope=${scope}&user_id=${userId}&return_url=${encodeURIComponent(returnUrl)}&callback_url=${encodeURIComponent(callbackUrl)}`;

    return NextResponse.redirect(authUrl);
}
