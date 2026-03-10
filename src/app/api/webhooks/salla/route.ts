import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const data = body.data;
    const merchant = body.merchant;

    if (event === "order.created" || event === "order.updated") {
      const store = await prisma.store.findFirst({
        where: { platformStoreId: String(merchant), platform: "SALLA" },
      });

      if (!store) return NextResponse.json({ received: true });

      const customer = data.customer || {};
      const shipping = data.shipping?.address || {};

      await prisma.order.upsert({
        where: {
          storeId_platformOrderId: {
            storeId: store.id,
            platformOrderId: String(data.id),
          },
        },
        update: {
          customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
          customerPhone: customer.mobile || "",
          totalAmount: data.total?.amount || 0,
          status: data.status?.slug || "pending",
        },
        create: {
          storeId: store.id,
          platformOrderId: String(data.id),
          customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
          customerPhone: customer.mobile || "",
          customerEmail: customer.email || "",
          shippingAddress: {
            street: shipping.street || "",
            city: shipping.city || "",
            country: shipping.country_code || "SA",
          },
          items: data.items || [],
          totalAmount: data.total?.amount || 0,
          status: data.status?.slug || "pending",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
