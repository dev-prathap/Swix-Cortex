import axios from "axios";

export class ShopifyConnector {
    private shopName: string;
    private accessToken: string;
    private apiVersion = "2024-01";

    constructor(shopName: string, accessToken: string) {
        // Sanitize shopName: remove https://, http://, and .myshopify.com
        this.shopName = shopName
            .replace(/^https?:\/\//, "")
            .replace(/\.myshopify\.com\/?.*$/, "")
            .split("/")[0];
        this.accessToken = accessToken;
    }

    private get baseUrl() {
        return `https://${this.shopName}.myshopify.com/admin/api/${this.apiVersion}`;
    }

    async fetchOrders(limit: number = 250) {
        try {
            const response = await axios.get(`${this.baseUrl}/orders.json`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                },
                params: {
                    limit,
                    status: "any",
                },
            });
            return response.data.orders;
        } catch (error) {
            console.error("[ShopifyConnector] Error fetching orders:", error);
            throw error;
        }
    }

    async fetchProducts() {
        try {
            const response = await axios.get(`${this.baseUrl}/products.json`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                },
            });
            return response.data.products;
        } catch (error) {
            console.error("[ShopifyConnector] Error fetching products:", error);
            throw error;
        }
    }

    async getShopInfo() {
        try {
            const response = await axios.get(`${this.baseUrl}/shop.json`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                },
            });
            return response.data.shop;
        } catch (error) {
            console.error("[ShopifyConnector] Error fetching shop info:", error);
            throw error;
        }
    }

    async fetchCustomers(limit: number = 250) {
        try {
            const response = await axios.get(`${this.baseUrl}/customers.json`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                },
                params: { limit },
            });
            return response.data.customers;
        } catch (error) {
            console.error("[ShopifyConnector] Error fetching customers:", error);
            throw error;
        }
    }
}
