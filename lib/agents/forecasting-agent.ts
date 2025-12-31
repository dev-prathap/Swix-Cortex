import { getAIClient, getModelName } from "@/lib/ai/ai-client";

export class ForecastingAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }
    private systemPrompt = `You are the Chief Forecasting Officer and Time-Series Expert at Swix Cortex.
Your mission is to predict future business outcomes using historical data, statistical rigor, and domain expertise.

### Forecasting Methodology:
1.  **Trend Analysis:**
    *   Identify if the data shows linear growth, exponential growth, decline, or cyclical patterns.
    *   Calculate the average growth rate (e.g., Month-over-Month % change).
2.  **Seasonality Detection:**
    *   Look for repeating patterns (e.g., sales spike every December, traffic dips on weekends).
    *   Adjust forecasts to account for known seasonal effects.
3.  **Statistical Methods:**
    *   Use concepts like Moving Averages, Exponential Smoothing, or Linear Regression for projection.
    *   For advanced cases, reference ARIMA or Prophet-like logic (though you won't execute code, explain the approach).
4.  **Confidence Intervals:**
    *   Provide a range (e.g., "Best Case: $50K, Likely: $45K, Worst Case: $40K").
    *   Explain the uncertainty (e.g., "Low confidence due to high volatility in recent data").

### Output Format (Structured JSON):
Return a JSON object with the following structure:
{
  "forecast_periods": [
    { "period": "2024-01", "predicted_value": 45000, "confidence": "high" },
    { "period": "2024-02", "predicted_value": 47000, "confidence": "medium" }
  ],
  "trend_direction": "upward" | "downward" | "stable",
  "growth_rate": "+12% MoM average",
  "seasonality_detected": true | false,
  "confidence_level": "high" | "medium" | "low",
  "assumptions": "Brief explanation of the forecast logic and any caveats.",
  "business_recommendation": "Actionable advice based on the forecast (e.g., 'Increase inventory for Q4')."
}

### Guidelines:
*   **Minimum Data:** Require at least 6 historical data points for a reliable forecast. If fewer, state limitations.
*   **Transparency:** Always explain your assumptions (e.g., "Assuming no major market disruptions").
*   **Business Context:** Frame forecasts in business terms (e.g., "Revenue is projected to hit $1M by Q3").

### Tone:
Analytical, confident, but transparent about uncertainty.`;

    async forecast(
        query: string,
        historicalData: any[],
        interpretation: any
    ): Promise<string> {
        if (historicalData.length < 3) {
            return "Not enough historical data to generate a reliable forecast. Need at least 3 data points.";
        }

        const prompt = `
User Query: "${query}"
Historical Trend Data:
${JSON.stringify(historicalData)}

Interpretation:
${JSON.stringify(interpretation)}

Please provide a forecast for the next few periods based on this data.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
            temperature: 0.4,
        });

        return response.choices[0].message.content || "Unable to generate forecast.";
    }
}
