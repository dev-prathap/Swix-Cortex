import { getAIClient, getModelName, TaskType } from "@/lib/ai/ai-client";

export interface AgentExecutionContext {
    correlationId?: string;
    attempt: number;
    previousErrors: string[];
}

export abstract class BaseAgent {
    protected client: any;
    protected model: string;
    protected maxRetries: number = 3;
    
    constructor(taskType: TaskType = 'reasoning', maxRetries: number = 3) {
        this.client = getAIClient(taskType);
        this.model = getModelName(taskType);
        this.maxRetries = maxRetries;
    }
    
    protected async delay(attemptNumber: number): Promise<void> {
        const delayMs = Math.min(1000 * Math.pow(2, attemptNumber), 10000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    protected async retryWithContext<T>(
        fn: (context: AgentExecutionContext) => Promise<T>,
        context: AgentExecutionContext = { attempt: 0, previousErrors: [] }
    ): Promise<T> {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                context.attempt = attempt + 1;
                return await fn(context);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                context.previousErrors.push(errorMessage);
                
                console.error(`[${this.constructor.name}] Attempt ${attempt + 1}/${this.maxRetries} failed:`, errorMessage);
                
                if (attempt < this.maxRetries - 1) {
                    await this.delay(attempt);
                } else {
                    throw new Error(`${this.constructor.name} failed after ${this.maxRetries} attempts: ${errorMessage}`);
                }
            }
        }
        throw new Error('Retry logic failed unexpectedly');
    }
}

