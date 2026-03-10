import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  const [
    totalShipments,
    pendingShipments,
    inTransitShipments,
    deliveredShipments,
    cancelledShipments,
    revenueResult,
    costResult,
    activeStores,
    availableWaybills,
    recentShipments,
    monthlyStats,
  ] = await Promise.all([
    prisma.shipment.count({ where: { userId } }),
    prisma.shipment.count({ where: { userId, status: "PENDING" } }),
    prisma.shipment.count({ where: { userId, status: "IN_TRANSIT" } }),
    prisma.shipment.count({ where: { userId, status: "DELIVERED" } }),
    prisma.shipment.count({ where: { userId, status: "CANCELLED" } }),
    prisma.shipment.aggregate({ where: { userId }, _sum: { price: true } }),
    prisma.shipment.aggregate({ where: { userId }, _sum: { costPrice: true } }),
    prisma.store.count({ where: { userId, isActive: true } }),
    prisma.waybill.count({ where: { userId, status: "AVAILABLE" } }),
    prisma.shipment.findMany({
      where: { userId },
      include: { carrier: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.shipment.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
  ]);

  const totalRevenue = revenueResult._sum.price || 0;
  const totalCost = costResult._sum.costPrice || 0;

  return NextResponse.json({
    stats: {
      totalShipments,
      pendingShipments,
      inTransitShipments,
      deliveredShipments,
      cancelledShipments,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      activeStores,
      availableWaybills,
    },
    recentShipments,
    monthlyStats,
  });
}
