import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const carriers = await prisma.carrier.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { shipments: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ carriers });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if ((session!.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();

  const carrier = await prisma.carrier.create({
    data: {
      code: body.code,
      name: body.name,
      nameAr: body.nameAr,
      logo: body.logo,
      basePrice: body.basePrice || 0,
      discountPct: body.discountPct || 0,
      apiConfig: body.apiConfig,
    },
  });

  return NextResponse.json({ carrier }, { status: 201 });
}
