import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const hmac = req.headers.get("x-shopify-hmac-sha256");
        const topic = req.headers.get("x-shopify-topic");
        const shopDomain = req.headers.get("x-shopify-shop-domain");

        // In production, verify HMAC
        // const hash = crypto.createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!).update(body).digest('base64');
        // if (hash !== hmac) return new Response('Invalid signature', { status: 401 });

        const payload = JSON.parse(body);

        // Find the data source for this shop
        const dataSource = await (prisma as any).dataSource.findFirst({
            where: {
                type: "SHOPIFY",
                connectionDetails: {
                    contains: shopDomain || "",
                },
            },
        });

        if (dataSource) {
            // Store event in real-time table (hot data)
            await (prisma as any).realtimeEvent.create({
                data: {
                    dataSourceId: dataSource.id,
                    eventType: topic || "shopify.webhook",
                    payload,
                    processed: false // Will be consolidated to Parquet later
                },
            });
            console.log(`[Shopify Webhook] ⚡ Real-time event stored: ${topic} for ${shopDomain}`);
            
            // Optional: Trigger immediate dashboard update via WebSocket/SSE
            // await notifyDashboard(dataSource.userId, topic, payload);
        } else {
            console.warn(`[Shopify Webhook] No data source found for ${shopDomain}`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Shopify webhook error:", error);
        return new Response("Error", { status: 500 });
    }
}
