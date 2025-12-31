import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { ContextManager } from "@/lib/services/context-manager";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-this-in-prod",
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { query, datasetId } = await req.json();

        if (!query || !datasetId) {
            return NextResponse.json({ error: "Query and datasetId are required" }, { status: 400 });
        }

        const contextManager = new ContextManager();
        const context = await contextManager.getRelevantContext(datasetId, query);

        const systemPrompt = `You are the "Business Brain" of Swix Cortex. 
Your role is to answer questions about a company's strategy, goals, and business context.

Use the following retrieved context to answer the user's question. 
If the context doesn't contain the answer, say you don't know based on the current knowledge base, but offer to help with general business advice.

CONTEXT:
${context || "No specific context found for this query."}

USER QUESTION:
${query}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0.7
        });

        return NextResponse.json({
            response: response.choices[0].message.content,
        });
    } catch (error) {
        console.error("Context query error:", error);
        return NextResponse.json({ error: "Failed to query Business Brain" }, { status: 500 });
    }
}
