import { CustomerProfilerAgent } from "@/lib/agents/customer-profiler-agent";

async function testCustomerProfiler() {
    console.log("🧪 Testing Customer Profiler Agent...\n");

    const profiler = new CustomerProfilerAgent();

    // Mock customer data
    const mockCustomer = {
        name: "John Doe",
        email: "john@example.com",
        orders: [
            { order_date: "2024-01-15", amount: 150, products: ["Laptop"] },
            { order_date: "2024-02-20", amount: 75, products: ["Mouse"] },
            { order_date: "2024-03-10", amount: 200, products: ["Keyboard", "Monitor"] },
            { order_date: "2024-11-25", amount: 120, products: ["Headphones"] },
            { order_date: "2024-12-15", amount: 300, products: ["Laptop Stand"] }
        ]
    };

    try {
        console.log("📊 Profiling customer:", mockCustomer.name);
        console.log("Total Orders:", mockCustomer.orders.length);
        console.log("Total Spent:", mockCustomer.orders.reduce((sum, o) => sum + o.amount, 0));
        console.log("\n⏳ Running AI analysis...\n");

        const profile = await profiler.profileCustomer("CUST-001", mockCustomer);

        console.log("✅ Profile Generated!\n");
        console.log("=".repeat(60));
        console.log("📋 CUSTOMER PROFILE");
        console.log("=".repeat(60));
        console.log("\n🎯 RFM Scores:");
        console.log("  - Recency:", profile.rfm_score.recency_score, "/5");
        console.log("  - Frequency:", profile.rfm_score.frequency_score, "/5");
        console.log("  - Monetary:", profile.rfm_score.monetary_score, "/5");
        console.log("  - Total Score:", profile.rfm_score.total_score, "/15");

        console.log("\n🏷️  Segment:", profile.segment);

        console.log("\n⚠️  Churn Risk:");
        console.log("  - Probability:", (profile.churn_risk.probability * 100).toFixed(1) + "%");
        console.log("  - Risk Level:", profile.churn_risk.risk_level.toUpperCase());
        console.log("  - Days Since Last Order:", profile.churn_risk.days_since_last_order);
        console.log("  - Expected Next Purchase:", profile.churn_risk.expected_next_purchase_days, "days");

        console.log("\n💰 Lifetime Value:");
        console.log("  - Total Spent: $" + profile.lifetime_value.total_spent.toLocaleString());
        console.log("  - Avg Order Value: $" + profile.lifetime_value.average_order_value.toFixed(2));
        console.log("  - Total Orders:", profile.lifetime_value.total_orders);
        console.log("  - Projected 12M LTV: $" + profile.lifetime_value.projected_ltv_12m.toLocaleString());

        console.log("\n💡 Recommendations:");
        profile.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });

        console.log("\n" + "=".repeat(60));
        console.log("✅ Test Completed Successfully!");
        console.log("=".repeat(60));

    } catch (error: any) {
        console.error("\n❌ Test Failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

testCustomerProfiler()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
