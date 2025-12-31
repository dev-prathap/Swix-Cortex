import OpenAI from "openai";
import { MODELS } from "./model-config";

export type TaskType = 'reasoning' | 'fast' | 'executive';

export function getAIClient(taskType: TaskType = 'reasoning') {
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (openRouterKey) {
        return new OpenAI({
            apiKey: openRouterKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://swix-cortex.ai",
                "X-Title": "Swix Cortex",
            }
        });
    }

    // Fallback to standard OpenAI if no OpenRouter key
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "dummy-key",
    });
}

export function getModelName(taskType: TaskType = 'reasoning'): string {
    // If using OpenRouter, use the specific mapped models
    if (process.env.OPENROUTER_API_KEY) {
        switch (taskType) {
            case 'reasoning': return MODELS.REASONING;
            case 'fast': return MODELS.FAST;
            case 'executive': return MODELS.EXECUTIVE;
            default: return MODELS.REASONING;
        }
    }

    // Fallback to gpt-4o if not using OpenRouter
    return "gpt-4o";
}
