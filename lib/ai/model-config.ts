export const MODELS = {
    REASONING: "anthropic/claude-sonnet-4.5",
    FAST: "google/gemini-3-flash-preview",
    EXECUTIVE: "openai/gpt-5.1"
} as const;

export type ModelType = keyof typeof MODELS;
