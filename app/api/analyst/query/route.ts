import { getUserId } from "@/lib/auth";
import { NLQueryEngine } from "@/lib/query/nl-query-engine";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    try {
        const { datasetId, query } = await req.json();

        if (!datasetId || !query) {
            return new Response(JSON.stringify({ error: "Dataset ID and query are required" }), { status: 400 });
        }

        const nlEngine = new NLQueryEngine();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const update of nlEngine.streamQuery(datasetId, userId, query)) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(update, (key, value) =>
                            typeof value === 'bigint' ? value.toString() : value
                        )}\n\n`));
                    }
                    controller.close();
                } catch (error: any) {
                    console.error("[Streaming Error]", error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error("[Analyst API] Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", message: error.message }), { status: 500 });
    }
}
