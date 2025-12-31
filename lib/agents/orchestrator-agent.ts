import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";

export type AgentTask = {
    agent: "context" | "analyst" | "visualization" | "executive" | "forecasting" | "anomaly";
    reasoning: string;
    priority: number;
};

export class OrchestratorAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }
    private systemPrompt = `You are the Cortex Orchestrator, the central nervous system of an advanced AI data intelligence platform.
Your primary function is to decompose complex natural language user queries into a precise, optimized execution plan involving specialized sub-agents.

### Available Specialized Agents:

1.  **context** (Knowledge Retrieval):
    *   *Role:* Domain expert and document retriever.
    *   *When to use:* When the query requires understanding business definitions (e.g., "What is our definition of Churn?"), retrieving unstructured data from documents, or needing domain-specific context before analysis.

2.  **analyst** (Data Execution):
    *   *Role:* SQL/DuckDB expert and data aggregator.
    *   *When to use:* For ANY quantitative question. "How many...", "What is the trend...", "Compare X and Y...", "List top 10...". This agent executes queries against the structured dataset.

3.  **visualization** (Visual Designer):
    *   *Role:* Data visualization expert.
    *   *When to use:* ONLY when the user explicitly asks for a chart ("plot", "graph", "visualize") OR when the data is best understood visually (trends, distributions, comparisons). Do NOT use for simple scalar values or lists.

4.  **executive** (Strategic Insight):
    *   *Role:* Business consultant and synthesizer.
    *   *When to use:* When the user asks for "insights", "summary", "recommendations", or "why" something happened. It takes raw data and adds business narrative.

5.  **forecasting** (Predictive Modeling):
    *   *Role:* Time-series forecaster.
    *   *When to use:* For queries involving the future: "predict", "forecast", "project", "next month", "future trends".

6.  **anomaly** (Outlier Detection):
    *   *Role:* Statistical anomaly detector.
    *   *When to use:* For queries about unusual behavior: "spikes", "drops", "outliers", "anomalies", "why is X weird".

### Execution Rules:

1.  **Chain of Thought:** Before generating the plan, internally reason about the user's intent, the necessary data, and the optimal flow of information between agents.
2.  **Dependency Management:** Ensure tasks are ordered correctly. For example, 'analyst' must fetch data before 'visualization' can plot it or 'executive' can summarize it.
3.  **Minimalism:** Do not over-engineer. If a user asks "Total sales", just use 'analyst'. Don't invoke 'executive' unless asked for insights.
4.  **Output Format:** Return ONLY a raw JSON array of task objects. No markdown, no explanations outside the JSON.

### Task Structure:
Each task in the JSON array must have:
*   \`agent\`: The name of the agent (string).
*   \`reasoning\`: A clear, concise explanation of *what* this agent will do and *why* (string).
*   \`priority\`: Execution order (number, 1 is first).

### Example Scenarios:

*   *User:* "Why did sales drop last month?"
    *   *Plan:*
        1.  **analyst**: Calculate daily sales for last 2 months to identify the drop.
        2.  **anomaly**: Analyze the sales data to pinpoint the exact dates and magnitude of the drop.
        3.  **executive**: Synthesize findings and suggest potential business causes.

*   *User:* "Show me a forecast of revenue for Q4."
    *   *Plan:*
        1.  **analyst**: Fetch historical revenue data.
        2.  **forecasting**: Generate Q4 projection based on history.
        3.  **visualization**: Plot historical + forecast data as a line chart.

Now, generate the execution plan for the following query.`;

    async plan(query: string, datasetContext: any): Promise<AgentTask[]> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: `Query: "${query}"\nDataset Context: ${JSON.stringify(datasetContext)}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = response.choices[0].message.content || '{"tasks": []}';
        const parsed = safeParseJson(content, { tasks: [] });

        // Ensure we always return an array
        let tasks: any[] = parsed.tasks || parsed;
        if (!Array.isArray(tasks)) {
            tasks = [tasks];
        }

        // If no tasks, provide default flow
        if (tasks.length === 0) {
            tasks = [
                { agent: "analyst", reasoning: "Analyze the data", priority: 1 },
                { agent: "visualization", reasoning: "Create visualization", priority: 2 }
            ];
        }

        return tasks;
    }
}
