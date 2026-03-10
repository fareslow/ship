import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const [waybills, total] = await Promise.all([
    prisma.waybill.findMany({
      where,
      include: { batch: { include: { carrier: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.waybill.count({ where }),
  ]);

  return NextResponse.json({
    waybills,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;
  const body = await req.json();
  const { batchId, quantity } = body;

  const batch = await prisma.waybillBatch.findUnique({
    where: { id: batchId },
    include: { carrier: true },
  });

  if (!batch) {
    return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
  }

  const availableWaybills = await prisma.waybill.findMany({
    where: { batchId, status: "AVAILABLE", userId: null },
    take: quantity || 1,
  });

  if (availableWaybills.length === 0) {
    return NextResponse.json({ error: "لا توجد بوليصات متاحة" }, { status: 400 });
  }

  const assigned = await prisma.waybill.updateMany({
    where: { id: { in: availableWaybills.map((w) => w.id) } },
    data: { userId, status: "RESERVED", assignedAt: new Date() },
  });

  return NextResponse.json({
    message: `تم حجز ${assigned.count} بوليصة بنجاح`,
    count: assigned.count,
  });
}
