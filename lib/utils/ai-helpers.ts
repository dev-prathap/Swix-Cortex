/**
 * Cleans a string that might contain markdown code blocks (e.g. ```json ... ```)
 * and returns only the JSON content.
 */
export function cleanJson(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.trim();

    // Check if content has markdown code blocks
    if (cleaned.includes('```')) {
        // Extract content between first ``` and last ```
        const match = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (match && match[1]) {
            cleaned = match[1].trim();
        } else {
            // Fallback: remove all backticks
            cleaned = cleaned.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
        }
    }

    return cleaned.trim();
}

/**
 * Safely parses JSON from an AI response, handling potential markdown wrapping.
 */
export function safeParseJson<T>(content: string, fallback: T): T {
    try {
        const cleaned = cleanJson(content);
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error("[AI Helpers] Failed to parse JSON:", error);
        console.error("[AI Helpers] Original content:", content);
        return fallback;
    }
}
