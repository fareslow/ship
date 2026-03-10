import { PlatformOrder } from "@/types";

export class ShopifyIntegration {
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = process.env.SHOPIFY_API_KEY || "";
    this.apiSecret = process.env.SHOPIFY_API_SECRET || "";
  }

  getAuthUrl(shop: string, redirectUri: string): string {
    const scopes = "read_orders,write_orders,read_fulfillments,write_fulfillments";
    return `https://${shop}/admin/oauth/authorize?client_id=${this.apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCode(shop: string, code: string): Promise<{ accessToken: string }> {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code,
      }),
    });

    const data = await response.json();
    return { accessToken: data.access_token };
  }

  async getOrders(shop: string, accessToken: string, params?: { page?: string; status?: string }): Promise<PlatformOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page_info", params.page);
    query.set("limit", "50");

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/orders.json?${query.toString()}`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return (data.orders || []).map((order: Record<string, unknown>) =>
      this.mapOrder(order)
    );
  }

  async getOrder(shop: string, accessToken: string, orderId: string): Promise<PlatformOrder | null> {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/orders/${orderId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!data.order) return null;
    return this.mapOrder(data.order);
  }

  async createFulfillment(
    shop: string,
    accessToken: string,
    orderId: string,
    trackingNumber: string,
    trackingCompany: string
  ): Promise<boolean> {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/orders/${orderId}/fulfillments.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fulfillment: {
            tracking_number: trackingNumber,
            tracking_company: trackingCompany,
            notify_customer: true,
          },
        }),
      }
    );

    return response.ok;
  }

  async getShopInfo(shop: string, accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    return response.json();
  }

  verifyWebhook(body: string, hmac: string): boolean {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", this.apiSecret)
      .update(body, "utf8")
      .digest("base64");
    return hash === hmac;
  }

  private mapOrder(order: Record<string, unknown>): PlatformOrder {
    const shipping = (order.shipping_address as Record<string, unknown>) || {};
    const lineItems = (order.line_items as Array<Record<string, unknown>>) || [];
    const customer = (order.customer as Record<string, unknown>) || {};

    return {
      platformOrderId: String(order.id || ""),
      customerName: `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim(),
      customerEmail: String(customer.email || order.email || ""),
      customerPhone: String(shipping.phone || customer.phone || ""),
      shippingAddress: {
        street: String(shipping.address1 || ""),
        city: String(shipping.city || ""),
        state: String(shipping.province || ""),
        postalCode: String(shipping.zip || ""),
        country: String(shipping.country_code || "SA"),
      },
      items: lineItems.map((item) => ({
        name: String(item.name || ""),
        sku: String(item.sku || ""),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        weight: Number(item.grams || 0) / 1000,
      })),
      totalAmount: Number(order.total_price || 0),
      currency: String(order.currency || "SAR"),
      status: String(order.fulfillment_status || "unfulfilled"),
      notes: String(order.note || ""),
    };
  }
}
