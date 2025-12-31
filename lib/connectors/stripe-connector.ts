import Stripe from "stripe";

export class StripeConnector {
    private stripe: Stripe;

    constructor(apiKey: string) {
        this.stripe = new Stripe(apiKey, {
            apiVersion: "2024-12-18.acacia" as any,
        });
    }

    async fetchCharges(limit: number = 100) {
        try {
            const charges = await this.stripe.charges.list({ limit });
            return charges.data;
        } catch (error) {
            console.error("[StripeConnector] Error fetching charges:", error);
            throw error;
        }
    }

    async fetchSubscriptions(limit: number = 100) {
        try {
            const subscriptions = await this.stripe.subscriptions.list({ limit });
            return subscriptions.data;
        } catch (error) {
            console.error("[StripeConnector] Error fetching subscriptions:", error);
            throw error;
        }
    }

    async fetchPayouts(limit: number = 100) {
        try {
            const payouts = await this.stripe.payouts.list({ limit });
            return payouts.data;
        } catch (error) {
            console.error("[StripeConnector] Error fetching payouts:", error);
            throw error;
        }
    }
}
