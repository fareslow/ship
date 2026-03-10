import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;

    if (event === "order.created" || event === "order.updated") {
      const orderData = body.data;
      const storeId = body.store_id;

      const store = await prisma.store.findFirst({
        where: { platformStoreId: String(storeId), platform: "ZID" },
      });

      if (!store) return NextResponse.json({ received: true });

      const address = orderData.address || {};

      await prisma.order.upsert({
        where: {
          storeId_platformOrderId: {
            storeId: store.id,
            platformOrderId: String(orderData.id),
          },
        },
        update: {
          customerName: orderData.customer_name || "",
          customerPhone: orderData.customer_phone || "",
          totalAmount: orderData.total_amount || 0,
          status: orderData.status || "pending",
        },
        create: {
          storeId: store.id,
          platformOrderId: String(orderData.id),
          customerName: orderData.customer_name || "",
          customerPhone: orderData.customer_phone || "",
          customerEmail: orderData.customer_email || "",
          shippingAddress: {
            street: address.street || "",
            city: address.city || "",
            country: "SA",
          },
          items: orderData.order_products || [],
          totalAmount: orderData.total_amount || 0,
          status: orderData.status || "pending",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
