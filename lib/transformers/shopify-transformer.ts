/**
 * Shopify Data Transformer
 * Converts raw Shopify API responses to a normalized flat schema for analytics
 */

export interface NormalizedOrder {
    // Order fields
    order_id: string;
    order_number: string;
    order_date: string;
    created_at: string;
    updated_at: string;
    
    // Customer fields (flattened)
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    
    // Financial fields
    total_price: number;
    subtotal_price: number;
    total_tax: number;
    total_discount: number;
    currency: string;
    
    // Status
    status: string;
    fulfillment_status: string | null;
    payment_status: string | null;
    
    // Shipping
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_country: string | null;
    
    // Metadata
    _type: 'order';
    _source: 'shopify';
}

export interface NormalizedProduct {
    // Product fields
    product_id: string;
    product_name: string;
    product_type: string | null;
    vendor: string | null;
    
    // Inventory
    sku: string | null;
    inventory_quantity: number;
    
    // Pricing
    price: number;
    compare_at_price: number | null;
    
    // Status
    status: string;
    published_at: string | null;
    
    // Metadata
    _type: 'product';
    _source: 'shopify';
}

export interface NormalizedCustomer {
    // Customer fields
    customer_id: string;
    customer_name: string;
    email: string;
    phone: string | null;
    
    // Stats
    total_spent: number;
    orders_count: number;
    
    // Dates
    created_at: string;
    updated_at: string;
    last_order_date: string | null;
    
    // Location
    city: string | null;
    country: string | null;
    
    // Metadata
    _type: 'customer';
    _source: 'shopify';
}

export class ShopifyTransformer {
    /**
     * Transform raw Shopify order to normalized format
     */
    transformOrder(rawOrder: any): NormalizedOrder {
        const customer = rawOrder.customer || {};
        const billingAddress = rawOrder.billing_address || {};
        const shippingAddress = rawOrder.shipping_address || {};
        
        return {
            // Order fields
            order_id: String(rawOrder.id || rawOrder.order_id || ''),
            order_number: String(rawOrder.order_number || rawOrder.name || ''),
            order_date: this.parseDate(rawOrder.processed_at || rawOrder.created_at || '') || new Date().toISOString(),
            created_at: this.parseDate(rawOrder.created_at || '') || new Date().toISOString(),
            updated_at: this.parseDate(rawOrder.updated_at || '') || new Date().toISOString(),
            
            // Customer fields (flattened)
            customer_id: String(customer.id || rawOrder.customer_id || ''),
            customer_name: this.getCustomerName(customer),
            customer_email: customer.email || rawOrder.email || '',
            customer_phone: customer.phone || billingAddress.phone || null,
            
            // Financial fields
            total_price: parseFloat(rawOrder.total_price || rawOrder.current_total_price || '0'),
            subtotal_price: parseFloat(rawOrder.subtotal_price || rawOrder.current_subtotal_price || '0'),
            total_tax: parseFloat(rawOrder.total_tax || '0'),
            total_discount: parseFloat(rawOrder.total_discounts || '0'),
            currency: rawOrder.currency || rawOrder.presentment_currency || 'USD',
            
            // Status
            status: this.normalizeStatus(rawOrder.financial_status || rawOrder.status),
            fulfillment_status: rawOrder.fulfillment_status || null,
            payment_status: rawOrder.financial_status || null,
            
            // Shipping
            shipping_address: this.formatAddress(shippingAddress),
            shipping_city: shippingAddress.city || null,
            shipping_country: shippingAddress.country || shippingAddress.country_code || null,
            
            // Metadata
            _type: 'order',
            _source: 'shopify'
        };
    }

    /**
     * Transform raw Shopify product to normalized format
     */
    transformProduct(rawProduct: any): NormalizedProduct[] {
        const products: NormalizedProduct[] = [];
        const variants = rawProduct.variants || [rawProduct];
        
        for (const variant of variants) {
            products.push({
                // Product fields
                product_id: String(variant.id || rawProduct.id || ''),
                product_name: rawProduct.title || rawProduct.name || 'Unknown Product',
                product_type: rawProduct.product_type || null,
                vendor: rawProduct.vendor || null,
                
                // Inventory
                sku: variant.sku || null,
                inventory_quantity: parseInt(variant.inventory_quantity || '0'),
                
                // Pricing
                price: parseFloat(variant.price || rawProduct.price || '0'),
                compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                
                // Status
                status: rawProduct.status || 'active',
                published_at: this.parseDate(rawProduct.published_at),
                
                // Metadata
                _type: 'product',
                _source: 'shopify'
            });
        }
        
        return products;
    }

    /**
     * Transform raw Shopify customer to normalized format
     */
    transformCustomer(rawCustomer: any): NormalizedCustomer {
        const defaultAddress = rawCustomer.default_address || {};
        
        return {
            // Customer fields
            customer_id: String(rawCustomer.id || ''),
            customer_name: this.getCustomerName(rawCustomer),
            email: rawCustomer.email || '',
            phone: rawCustomer.phone || defaultAddress.phone || null,
            
            // Stats
            total_spent: parseFloat(rawCustomer.total_spent || '0'),
            orders_count: parseInt(rawCustomer.orders_count || '0'),
            
            // Dates
            created_at: this.parseDate(rawCustomer.created_at) || new Date().toISOString(),
            updated_at: this.parseDate(rawCustomer.updated_at) || new Date().toISOString(),
            last_order_date: this.parseDate(rawCustomer.last_order_date) || null,
            
            // Location
            city: defaultAddress.city || null,
            country: defaultAddress.country || defaultAddress.country_code || null,
            
            // Metadata
            _type: 'customer',
            _source: 'shopify'
        };
    }

    // Helper methods
    private getCustomerName(customer: any): string {
        if (customer.first_name || customer.last_name) {
            return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }
        if (customer.name) return customer.name;
        return customer.email || 'Guest';
    }

    private parseDate(dateString: any): string | null {
        if (!dateString) return null;
        try {
            return new Date(dateString).toISOString();
        } catch {
            return null;
        }
    }

    private normalizeStatus(status: string | null): string {
        if (!status) return 'pending';
        const normalized = status.toLowerCase();
        
        const statusMap: Record<string, string> = {
            'paid': 'completed',
            'pending': 'pending',
            'authorized': 'processing',
            'partially_paid': 'processing',
            'refunded': 'refunded',
            'voided': 'cancelled',
            'partially_refunded': 'refunded'
        };
        
        return statusMap[normalized] || status;
    }

    private formatAddress(address: any): string | null {
        if (!address) return null;
        
        const parts = [
            address.address1,
            address.address2,
            address.city,
            address.province,
            address.zip
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : null;
    }
}

