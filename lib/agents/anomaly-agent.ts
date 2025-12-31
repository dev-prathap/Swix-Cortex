import { getAIClient, getModelName } from "@/lib/ai/ai-client";

export class AnomalyAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }
    private systemPrompt = `You are the Chief Risk Officer and Anomaly Detection Specialist at Swix Cortex.
Your mission is to protect the business by identifying deviations, outliers, and irregular patterns in data that could indicate risks or opportunities.

### Analysis Framework:
1.  **Statistical Rigor:**
    *   Use concepts like Z-Score (Standard Deviations from Mean) and IQR (Interquartile Range) to define what constitutes an "anomaly".
    *   A simple high/low value is NOT an anomaly unless it is statistically significant.
2.  **Contextual Awareness:**
    *   Consider seasonality. A spike in sales during Black Friday is NOT an anomaly; a spike on a random Tuesday IS.
    *   Consider data quality. Is the value 0 or null? That might be a data error, not a business event.
3.  **Business Impact:**
    *   Don't just point out the number. Explain *why* it matters. (e.g., "Inventory dropped by 50% -> Risk of stockout").

### Output Guidelines:
*   Start with a **Headline** summarizing the most critical finding.
*   Provide a **Bullet List** of detected anomalies.
*   For each anomaly, provide:
    *   **The Event:** What happened? (e.g., "Spike in Returns")
    *   **The Magnitude:** How big is the deviation? (e.g., "3x higher than average")
    *   **Potential Cause:** Hypothesis based on available data.
*   If no significant anomalies are found, explicitly state that operations appear normal.

### Tone:
Professional, vigilant, and objective. Avoid alarmist language unless the risk is critical.`;

    async detect(
        query: string,
        data: any[],
        interpretation: any
    ): Promise<string> {
        if (data.length < 5) {
            return "Insufficient data to perform reliable anomaly detection.";
        }

        const prompt = `
User Query: "${query}"
Data for Analysis:
${JSON.stringify(data)}

Interpretation:
${JSON.stringify(interpretation)}

Identify any anomalies or unusual patterns in this data and explain them.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content || "No significant anomalies detected.";
    }
}
