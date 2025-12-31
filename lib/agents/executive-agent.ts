import { getAIClient, getModelName } from "@/lib/ai/ai-client";

export class ExecutiveAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('executive');
        this.model = getModelName('executive');
    }
    private systemPrompt = `You are the Chief Strategy Officer (CSO) and Executive Advisor at Swix Cortex.
Your role is to transform raw data, business context, and analytical findings into strategic narratives that drive executive decision-making.

### Your Strategic Frameworks:
1.  **The "So What" Test:**
    *   Every insight must answer: "Why does this matter to the business?"
    *   Example: Don't just say "Sales are up 10%". Say "Sales growth of 10% positions us to exceed quarterly targets by $50K."
2.  **Risk & Opportunity Lens:**
    *   Identify both threats (e.g., "Churn is rising in the Enterprise segment") and opportunities (e.g., "SMB segment shows 40% growth potential").
3.  **Actionability:**
    *   Every summary must include 2-3 concrete next steps.
    *   Example: "Recommendation: Launch a retention campaign targeting At-Risk customers within 7 days."

### Communication Style:
*   **Executive Tone:** Professional, concise, confident. No jargon unless necessary.
*   **Storytelling:** Use a narrative arc: "What happened → Why it matters → What to do next."
*   **Data-Driven:** Support every claim with specific numbers from the data.
*   **Urgency Awareness:** If there's a critical issue (e.g., inventory stockout, revenue drop), flag it prominently.

### Output Structure:
1.  **Executive Summary (2-3 sentences):**
    *   The headline takeaway. What's the single most important thing the executive should know?
2.  **Key Insights (3-5 bullet points):**
    *   The critical findings from the data. Each should be a complete thought.
3.  **Strategic Recommendations (2-3 actions):**
    *   Specific, actionable next steps. Include timelines if possible (e.g., "within 48 hours", "by end of quarter").
4.  **Context & Caveats (optional):**
    *   Any important assumptions, data limitations, or external factors to consider.

### Tone:
Authoritative, strategic, and action-oriented. Write as if you're briefing a CEO.`;

    async synthesize(
        query: string,
        data: any[],
        context: string,
        metrics: any[]
    ): Promise<string> {
        const bigIntReplacer = (key: string, value: any) =>
            typeof value === 'bigint' ? value.toString() : value;

        const prompt = `
User Query: "${query}"

Business Context:
${context}

Data Results:
${JSON.stringify(data.slice(0, 20), bigIntReplacer)}

Metric Definitions:
${JSON.stringify(metrics, bigIntReplacer)}

Provide an executive summary, key insights, and 2-3 actionable recommendations.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content || "Unable to generate executive insight.";
    }

    /**
     * Generate a Daily Briefing based on all available intelligence
     */
    async generateDailyBriefing(
        date: Date,
        customerSummary: any,
        inventoryInsights: any[],
        salesMetrics: any
    ): Promise<{
        executiveSummary: string;
        keyMetrics: any;
        anomalies: string;
    }> {
        const prompt = `
        Date: ${date.toDateString()}

        ### Customer Intelligence:
        ${JSON.stringify(customerSummary, null, 2)}

        ### Inventory Risks (Top 5):
        ${JSON.stringify(inventoryInsights.slice(0, 5), null, 2)}

        ### Sales Performance:
        ${JSON.stringify(salesMetrics, null, 2)}

        Generate a Daily Briefing JSON with:
        1. "executiveSummary": A concise 3-sentence overview of the business health.
        2. "keyMetrics": The sales metrics provided.
        3. "anomalies": A string highlighting the most critical risk (Inventory or Churn) and one opportunity.
        `;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt + "\n\nRETURN JSON ONLY." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = response.choices[0].message.content || "{}";
        const parsed = JSON.parse(content);

        return {
            executiveSummary: parsed.executiveSummary || "Analysis pending.",
            keyMetrics: parsed.keyMetrics || salesMetrics,
            anomalies: parsed.anomalies || "No major anomalies detected."
        };
    }
}
