import { PlatformOrder } from "@/types";

export class ZidIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.ZID_CLIENT_ID || "";
    this.clientSecret = process.env.ZID_CLIENT_SECRET || "";
    this.redirectUri = process.env.ZID_REDIRECT_URI || "";
  }

  getAuthUrl(): string {
    return `https://oauth.zid.sa/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch("https://oauth.zid.sa/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch("https://oauth.zid.sa/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  }

  async getOrders(accessToken: string, page = 1): Promise<PlatformOrder[]> {
    const response = await fetch(
      `https://api.zid.sa/v1/managers/store/orders?page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "ar",
        },
      }
    );

    const data = await response.json();
    return (data.orders || []).map((order: Record<string, unknown>) =>
      this.mapOrder(order)
    );
  }

  async getOrder(accessToken: string, orderId: string): Promise<PlatformOrder | null> {
    const response = await fetch(
      `https://api.zid.sa/v1/managers/store/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "ar",
        },
      }
    );

    const data = await response.json();
    if (!data.order) return null;
    return this.mapOrder(data.order);
  }

  async updateOrderStatus(accessToken: string, orderId: string, status: string, trackingNumber?: string): Promise<boolean> {
    const body: Record<string, string> = { status };
    if (trackingNumber) body.tracking_number = trackingNumber;

    const response = await fetch(
      `https://api.zid.sa/v1/managers/store/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    return response.ok;
  }

  async getStoreInfo(accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch("https://api.zid.sa/v1/managers/account/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }

  private mapOrder(order: Record<string, unknown>): PlatformOrder {
    const address = order.address as Record<string, unknown> || {};
    const items = (order.order_products as Array<Record<string, unknown>>) || [];

    return {
      platformOrderId: String(order.id || ""),
      customerName: String(order.customer_name || ""),
      customerEmail: String(order.customer_email || ""),
      customerPhone: String(order.customer_phone || ""),
      shippingAddress: {
        street: String(address.street || ""),
        city: String(address.city?.toString() || ""),
        country: "SA",
        district: String(address.district || ""),
      },
      items: items.map((item) => ({
        name: String(item.name || ""),
        sku: String(item.sku || ""),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      })),
      totalAmount: Number(order.total_amount || 0),
      currency: "SAR",
      status: String(order.status || ""),
      notes: String(order.notes || ""),
    };
  }
}
