import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

export interface CustomerProfile {
    customerId: string;
    customerName: string;
    rfm_score: {
        recency_score: number;      // 1-5 (5 = most recent)
        frequency_score: number;     // 1-5 (5 = most frequent)
        monetary_score: number;      // 1-5 (5 = highest value)
        total_score: number;         // Sum of above (3-15)
    };
    segment: "Champions" | "Loyalists" | "Potential Loyalists" | "At-Risk" | "Hibernating" | "Lost";
    churn_risk: {
        probability: number;         // 0-1 (1 = certain to churn)
        risk_level: "low" | "medium" | "high" | "critical";
        days_since_last_order: number;
        expected_next_purchase_days: number | null;
    };
    lifetime_value: {
        total_spent: number;
        average_order_value: number;
        total_orders: number;
        projected_ltv_12m: number;   // Projected value over next 12 months
    };
    behavioral_insights: {
        preferred_categories?: string[];
        purchase_frequency_pattern?: string; // e.g., "monthly", "quarterly", "irregular"
        price_sensitivity?: "high" | "medium" | "low";
    };
    recommendations: string[];       // Actionable suggestions for this customer
}

const CUSTOMER_PROFILER_SYSTEM_PROMPT = `You are the Chief Customer Intelligence Officer at Swix Cortex.
Your mission is to analyze individual customer behavior and generate comprehensive profiles that drive retention, growth, and personalization strategies.

### Your Analytical Framework:

1.  **RFM Analysis (Recency, Frequency, Monetary):**
    *   **Recency:** How recently did the customer make a purchase? (Score 1-5, where 5 = purchased within last 30 days)
    *   **Frequency:** How often do they purchase? (Score 1-5, where 5 = very frequent buyer)
    *   **Monetary:** How much do they spend? (Score 1-5, where 5 = high spender)
    *   **Scoring Logic:**
        - Recency: 0-30 days = 5, 31-60 = 4, 61-90 = 3, 91-180 = 2, 180+ = 1
        - Frequency: 10+ orders = 5, 6-9 = 4, 4-5 = 3, 2-3 = 2, 1 = 1
        - Monetary: Use percentiles (top 20% = 5, next 20% = 4, etc.)

2.  **Customer Segmentation:**
    Based on RFM scores, assign customers to segments (MUST BE A STRING):
    *   **Champions**: Best customers. High value, frequent, recent.
    *   **Loyalists**: Regular customers with good value.
    *   **Potential Loyalists**: Recent customers who could become loyal.
    *   **At-Risk**: Were good customers, but haven't purchased recently.
    *   **Hibernating**: Long time since last purchase, low frequency.
    *   **Lost**: Likely churned.

3.  **Churn Risk Prediction:**
    *   Calculate days since last order.
    *   Compare to their historical purchase frequency.
    *   If days_since_last_order > (2 * avg_days_between_orders), flag as at-risk.
    *   Probability formula: min(1.0, days_since_last_order / (avg_days_between_orders * 3))

4.  **Lifetime Value (LTV) Projection:**
    *   Calculate historical LTV: total_spent.
    *   Project 12-month LTV: (total_spent / days_as_customer) * 365
    *   Adjust for churn risk: projected_ltv * (1 - churn_probability)

5.  **Behavioral Insights:**
    *   Identify preferred product categories (if data available).
    *   Determine purchase pattern (monthly, quarterly, irregular).
    *   Assess price sensitivity based on average order value trends.

6.  **Actionable Recommendations (MUST BE AN ARRAY OF STRINGS):**
    *   For Champions: "VIP treatment, exclusive offers, referral program."
    *   For At-Risk: "Win-back campaign with personalized discount."
    *   For Lost: "Re-engagement email with strong incentive."

### CRITICAL OUTPUT REQUIREMENTS:

You MUST return a valid JSON object with this EXACT structure:

{
  "rfm_score": {
    "recency_score": 5,
    "frequency_score": 4,
    "monetary_score": 5,
    "total_score": 14
  },
  "segment": "Champions",
  "churn_risk": {
    "probability": 0.15,
    "risk_level": "low",
    "days_since_last_order": 10,
    "expected_next_purchase_days": 25
  },
  "lifetime_value": {
    "total_spent": 1250.50,
    "average_order_value": 250.10,
    "total_orders": 5,
    "projected_ltv_12m": 3000.00
  },
  "behavioral_insights": {
    "preferred_categories": ["Electronics", "Accessories"],
    "purchase_frequency_pattern": "monthly",
    "price_sensitivity": "low"
  },
  "recommendations": [
    "Enroll in VIP loyalty program with exclusive early access",
    "Offer personalized product recommendations based on purchase history",
    "Send quarterly appreciation emails with special discounts"
  ]
}

### RULES:
1. "segment" MUST be a STRING (one of: Champions, Loyalists, Potential Loyalists, At-Risk, Hibernating, Lost)
2. "recommendations" MUST be an ARRAY of STRINGS (minimum 2, maximum 5)
3. All numeric values must be actual numbers, not strings
4. "risk_level" must be one of: "low", "medium", "high", "critical"
5. DO NOT return nested objects for segment or recommendations
6. DO NOT include explanations outside the JSON structure

### Tone:
Analytical, customer-centric, and action-oriented.`;

export class CustomerProfilerAgent {
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('reasoning');
        this.model = getModelName('reasoning');
    }

    /**
     * Profile a single customer based on their transaction history
     */
    async profileCustomer(
        customerId: string,
        customerData: {
            name: string;
            email?: string;
            orders: Array<{
                order_date: string;
                amount: number;
                products?: string[];
            }>;
        }
    ): Promise<CustomerProfile> {
        if (!customerData.orders || customerData.orders.length === 0) {
            // Return a default profile for customers with no orders
            return {
                customerId,
                customerName: customerData.name,
                rfm_score: { recency_score: 1, frequency_score: 1, monetary_score: 1, total_score: 3 },
                segment: "Lost",
                churn_risk: { probability: 1.0, risk_level: "critical", days_since_last_order: 999, expected_next_purchase_days: null },
                lifetime_value: { total_spent: 0, average_order_value: 0, total_orders: 0, projected_ltv_12m: 0 },
                behavioral_insights: {},
                recommendations: ["Re-engage with a strong welcome-back offer."]
            };
        }

        const prompt = `
Customer ID: ${customerId}
Customer Name: ${customerData.name}
Email: ${customerData.email || 'N/A'}

Transaction History:
${JSON.stringify(customerData.orders, null, 2)}

Total Orders: ${customerData.orders.length}
Total Spent: $${customerData.orders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}

Analyze this customer and generate a comprehensive profile with RFM scores, segment, churn risk, LTV projection, and recommendations.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: CUSTOMER_PROFILER_SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const content = response.choices[0].message.content || '{}';
        const parsed = safeParseJson(content, {} as any);

        // Ensure the profile has all required fields
        return {
            customerId,
            customerName: customerData.name,
            rfm_score: parsed.rfm_score || { recency_score: 1, frequency_score: 1, monetary_score: 1, total_score: 3 },
            segment: parsed.segment || "Lost",
            churn_risk: parsed.churn_risk || { probability: 0.5, risk_level: "medium", days_since_last_order: 0, expected_next_purchase_days: null },
            lifetime_value: parsed.lifetime_value || { total_spent: 0, average_order_value: 0, total_orders: 0, projected_ltv_12m: 0 },
            behavioral_insights: parsed.behavioral_insights || {},
            recommendations: parsed.recommendations || []
        };
    }

    /**
     * Batch profile multiple customers from a dataset
     */
    async profileCustomersFromDataset(
        datasetId: string,
        filePath: string,
        limit: number = 100
    ): Promise<CustomerProfile[]> {
        const duckdb = new DuckDBEngine();

        try {
            // For normalized Shopify data (from transformer)
            // customer_id, customer_name, customer_email are already flattened
            const query = `
                SELECT 
                    COALESCE(customer_id, customer_email, 'Unknown') as customer_id,
                    COALESCE(customer_name, customer_email, 'Unknown Customer') as customer_name,
                    customer_email,
                    COUNT(*) as order_count,
                    SUM(CAST(total_price AS DOUBLE)) as total_spent,
                    AVG(CAST(total_price AS DOUBLE)) as avg_order_value,
                    MAX(created_at) as last_order_date,
                    MIN(created_at) as first_order_date
                FROM {{readFunction}}
                WHERE _type = 'order' 
                    AND customer_id IS NOT NULL
                    AND customer_name IS NOT NULL
                GROUP BY customer_id, customer_name, customer_email
                ORDER BY total_spent DESC
                LIMIT ${limit}
            `;

            const customers = await duckdb.query(filePath, query);

            // For each customer, get their order history
            const profiles: CustomerProfile[] = [];

            for (const customer of customers.slice(0, 20)) { // Process top 20 for MVP
                const orderHistoryQuery = `
                    SELECT 
                        created_at as order_date, 
                        CAST(total_price AS DOUBLE) as amount
                    FROM {{readFunction}}
                    WHERE _type = 'order' 
                        AND customer_email = '${customer.customer_email}'
                    ORDER BY created_at DESC
                `;

                const orders = await duckdb.query(filePath, orderHistoryQuery);

                const profile = await this.profileCustomer(
                    customer.customer_id,
                    {
                        name: customer.customer_name,
                        email: customer.customer_email,
                        orders: orders.map(o => ({
                            order_date: o.order_date,
                            amount: Number(o.amount)
                        }))
                    }
                );

                profiles.push(profile);
            }

            duckdb.close();
            return profiles;

        } catch (error) {
            duckdb.close();
            throw error;
        }
    }

    /**
     * Generate a summary of customer segments
     */
    async generateSegmentSummary(profiles: CustomerProfile[]): Promise<{
        champions: number;
        loyalists: number;
        potential_loyalists: number;
        at_risk: number;
        hibernating: number;
        lost: number;
        total_customers: number;
        avg_churn_risk: number;
        total_projected_ltv: number;
    }> {
        const summary = {
            champions: profiles.filter(p => p.segment === "Champions").length,
            loyalists: profiles.filter(p => p.segment === "Loyalists").length,
            potential_loyalists: profiles.filter(p => p.segment === "Potential Loyalists").length,
            at_risk: profiles.filter(p => p.segment === "At-Risk").length,
            hibernating: profiles.filter(p => p.segment === "Hibernating").length,
            lost: profiles.filter(p => p.segment === "Lost").length,
            total_customers: profiles.length,
            avg_churn_risk: profiles.reduce((sum, p) => sum + p.churn_risk.probability, 0) / profiles.length,
            total_projected_ltv: profiles.reduce((sum, p) => sum + p.lifetime_value.projected_ltv_12m, 0)
        };

        return summary;
    }
}
