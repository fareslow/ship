import { PlatformOrder } from "@/types";

export class SallaIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SALLA_CLIENT_ID || "";
    this.clientSecret = process.env.SALLA_CLIENT_SECRET || "";
    this.redirectUri = process.env.SALLA_REDIRECT_URI || "";
  }

  getAuthUrl(): string {
    return `https://accounts.salla.sa/oauth2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=offline_access`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch("https://accounts.salla.sa/oauth2/token", {
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
    const response = await fetch("https://accounts.salla.sa/oauth2/token", {
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
    const response = await fetch(`https://api.salla.dev/admin/v2/orders?page=${page}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return (data.data || []).map((order: Record<string, unknown>) =>
      this.mapOrder(order)
    );
  }

  async getOrder(accessToken: string, orderId: string): Promise<PlatformOrder | null> {
    const response = await fetch(`https://api.salla.dev/admin/v2/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!data.data) return null;
    return this.mapOrder(data.data);
  }

  async updateOrderStatus(accessToken: string, orderId: string, status: string, trackingNumber?: string): Promise<boolean> {
    const body: Record<string, unknown> = { status };
    if (trackingNumber) {
      body.shipment = { tracking_number: trackingNumber };
    }

    const response = await fetch(
      `https://api.salla.dev/admin/v2/orders/${orderId}/status`,
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
    const response = await fetch("https://api.salla.dev/admin/v2/store/info", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }

  private mapOrder(order: Record<string, unknown>): PlatformOrder {
    const customer = (order.customer as Record<string, unknown>) || {};
    const shipping = (order.shipping as Record<string, unknown>) || {};
    const address = (shipping.address as Record<string, unknown>) || {};
    const items = (order.items as Array<Record<string, unknown>>) || [];

    return {
      platformOrderId: String(order.id || ""),
      customerName: String(customer.first_name || "") + " " + String(customer.last_name || ""),
      customerEmail: String(customer.email || ""),
      customerPhone: String(customer.mobile || ""),
      shippingAddress: {
        street: String(address.street || ""),
        city: String(address.city || ""),
        country: String(address.country_code || "SA"),
        district: String(address.district || ""),
      },
      items: items.map((item) => ({
        name: String(item.name || ""),
        sku: String(item.sku || ""),
        quantity: Number(item.quantity || 1),
        price: Number(item.price?.toString() || 0),
      })),
      totalAmount: Number(order.total?.toString() || 0),
      currency: "SAR",
      status: String(order.status || ""),
    };
  }
}
