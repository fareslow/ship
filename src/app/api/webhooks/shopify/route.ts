import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { shopifyIntegration } from "@/lib/integrations";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
    const topic = req.headers.get("x-shopify-topic") || "";
    const shopDomain = req.headers.get("x-shopify-shop-domain") || "";

    // Verify webhook signature
    if (!shopifyIntegration.verifyWebhook(rawBody, hmac)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(rawBody);

    if (topic === "orders/create" || topic === "orders/updated") {
      const store = await prisma.store.findFirst({
        where: { domain: shopDomain, platform: "SHOPIFY" },
      });

      if (!store) return NextResponse.json({ received: true });

      const shipping = data.shipping_address || {};
      const customer = data.customer || {};

      await prisma.order.upsert({
        where: {
          storeId_platformOrderId: {
            storeId: store.id,
            platformOrderId: String(data.id),
          },
        },
        update: {
          customerName: `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim(),
          customerPhone: shipping.phone || "",
          totalAmount: parseFloat(data.total_price || "0"),
          status: data.fulfillment_status || "unfulfilled",
        },
        create: {
          storeId: store.id,
          platformOrderId: String(data.id),
          customerName: `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim(),
          customerPhone: shipping.phone || customer.phone || "",
          customerEmail: data.email || customer.email || "",
          shippingAddress: {
            street: shipping.address1 || "",
            city: shipping.city || "",
            state: shipping.province || "",
            postalCode: shipping.zip || "",
            country: shipping.country_code || "SA",
          },
          items: (data.line_items || []).map((item: Record<string, unknown>) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: parseFloat(data.total_price || "0"),
          currency: data.currency || "SAR",
          status: data.fulfillment_status || "unfulfilled",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
