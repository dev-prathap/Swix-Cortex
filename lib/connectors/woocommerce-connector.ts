import axios from "axios";

export class WooCommerceConnector {
    private url: string;
    private consumerKey: string;
    private consumerSecret: string;

    constructor(url: string, consumerKey: string, consumerSecret: string) {
        this.url = url.replace(/\/$/, ""); // Remove trailing slash
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
    }

    private get authParams() {
        return {
            consumer_key: this.consumerKey,
            consumer_secret: this.consumerSecret,
        };
    }

    async fetchOrders(perPage: number = 100) {
        try {
            const response = await axios.get(`${this.url}/wp-json/wc/v3/orders`, {
                params: {
                    ...this.authParams,
                    per_page: perPage,
                },
            });
            return response.data;
        } catch (error) {
            console.error("[WooCommerceConnector] Error fetching orders:", error);
            throw error;
        }
    }

    async fetchProducts() {
        try {
            const response = await axios.get(`${this.url}/wp-json/wc/v3/products`, {
                params: {
                    ...this.authParams,
                    per_page: 100,
                },
            });
            return response.data;
        } catch (error) {
            console.error("[WooCommerceConnector] Error fetching products:", error);
            throw error;
        }
    }

    async verifyConnection() {
        try {
            const response = await axios.get(`${this.url}/wp-json/wc/v3/system_status`, {
                params: {
                    ...this.authParams,
                },
            });
            return !!response.data;
        } catch (error) {
            console.error("[WooCommerceConnector] Verification failed:", error);
            return false;
        }
    }
}
