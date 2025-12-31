import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // WooCommerce sends: key_id, user_id, consumer_key, consumer_secret, key_permissions
        const { user_id, consumer_key, consumer_secret, key_permissions } = body;

        if (!user_id || !consumer_key || !consumer_secret) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Save data source
        await (prisma as any).dataSource.create({
            data: {
                userId: user_id,
                name: "WooCommerce Store",
                type: "WOOCOMMERCE",
                connectionDetails: JSON.stringify({
                    consumerKey: consumer_key,
                    consumerSecret: consumer_secret,
                    permissions: key_permissions
                }),
                status: "ACTIVE",
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("WooCommerce Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
