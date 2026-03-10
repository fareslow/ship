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
    include: { carrier: true, store: true, order: true, trackingEvents: { orderBy: { timestamp: "desc" } } },
  });

  if (!shipment) {
    return NextResponse.json({ error: "الشحنة غير موجودة" }, { status: 404 });
  }

  return NextResponse.json({ shipment });
}

export async function DELETE(
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

  if (!shipment) {
    return NextResponse.json({ error: "الشحنة غير موجودة" }, { status: 404 });
  }

  if (shipment.trackingNumber) {
    const carrierService = getCarrier(shipment.carrier.code);
    if (carrierService) {
      await carrierService.cancelShipment(shipment.trackingNumber);
    }
  }

  await prisma.shipment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ message: "تم إلغاء الشحنة بنجاح" });
}
