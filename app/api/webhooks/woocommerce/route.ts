import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const topic = req.headers.get("x-wc-webhook-topic");
        const source = req.headers.get("x-wc-webhook-source"); // Usually the site URL

        // Find the data source for this WooCommerce store
        const dataSource = await (prisma as any).dataSource.findFirst({
            where: {
                type: "WOOCOMMERCE",
                connectionDetails: {
                    contains: source || "",
                },
            },
        });

        if (dataSource) {
            await (prisma as any).realtimeEvent.create({
                data: {
                    dataSourceId: dataSource.id,
                    eventType: topic || "woocommerce.webhook",
                    payload,
                },
            });
            console.log(`[WooCommerce Webhook] Received ${topic} from ${source}`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("WooCommerce webhook error:", error);
        return new Response("Error", { status: 500 });
    }
}
