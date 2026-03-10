import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { getCarrier } from "@/lib/carriers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const shipment = await prisma.shipment.findFirst({
    where: { id, userId: (session!.user as { id: string }).id },
    include: { carrier: true },
  });

  if (!shipment || !shipment.trackingNumber) {
    return NextResponse.json({ error: "الشحنة غير موجودة أو لا يوجد رقم تتبع" }, { status: 404 });
  }

  const carrierService = getCarrier(shipment.carrier.code);
  if (!carrierService) {
    return NextResponse.json({ error: "خدمة شركة الشحن غير متوفرة" }, { status: 400 });
  }

  const trackingResult = await carrierService.trackShipment(shipment.trackingNumber);

  if (trackingResult.success && trackingResult.events.length > 0) {
    // Store tracking events
    for (const event of trackingResult.events) {
      await prisma.trackingEvent.upsert({
        where: { id: `${shipment.id}-${event.timestamp.getTime()}` },
        update: {},
        create: {
          shipmentId: shipment.id,
          status: event.status,
          description: event.description,
          location: event.location,
          timestamp: event.timestamp,
          rawData: event.rawData as object || null,
        },
      });
    }

    // Map carrier status to our status
    const statusMap: Record<string, string> = {
      picked_up: "PICKED_UP",
      in_transit: "IN_TRANSIT",
      out_for_delivery: "OUT_FOR_DELIVERY",
      delivered: "DELIVERED",
      returned: "RETURNED",
    };

    const newStatus = statusMap[trackingResult.currentStatus?.toLowerCase() || ""] || shipment.status;
    if (newStatus !== shipment.status) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: newStatus as never },
      });
    }
  }

  return NextResponse.json({ tracking: trackingResult });
}
