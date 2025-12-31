import { ContextManager } from "@/lib/services/context-manager";

export class ContextAgent {
    private contextManager = new ContextManager();

    async getContext(query: string, datasetId: string): Promise<string> {
        try {
            const context = await this.contextManager.getRelevantContext(datasetId, query);

            if (!context || (Array.isArray(context) && context.length === 0)) {
                return "No specific business context found in uploaded documents.";
            }

            if (Array.isArray(context)) {
                return context.map((c: any) => c.content).join("\n\n");
            }

            return String(context);
        } catch (error) {
            console.error("[ContextAgent] Error:", error);
            return "Error retrieving business context.";
        }
    }
}
