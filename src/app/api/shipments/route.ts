import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { getCarrier } from "@/lib/carriers";

const createShipmentSchema = z.object({
  carrierId: z.string(),
  storeId: z.string().optional(),
  orderId: z.string().optional(),
  senderName: z.string().min(2),
  senderPhone: z.string().min(9),
  senderCity: z.string().min(2),
  senderAddress: z.string().min(5),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(9),
  receiverCity: z.string().min(2),
  receiverAddress: z.string().min(5),
  weight: z.number().min(0.1).default(1),
  pieces: z.number().min(1).default(1),
  codAmount: z.number().min(0).default(0),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const carrierId = searchParams.get("carrierId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {
    userId: (session!.user as { id: string }).id,
  };

  if (status) where.status = status;
  if (carrierId) where.carrierId = carrierId;
  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: "insensitive" } },
      { receiverName: { contains: search, mode: "insensitive" } },
      { receiverPhone: { contains: search } },
    ];
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: { carrier: true, store: true, order: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return NextResponse.json({
    shipments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createShipmentSchema.parse(body);

    const carrier = await prisma.carrier.findUnique({
      where: { id: data.carrierId },
    });

    if (!carrier) {
      return NextResponse.json({ error: "شركة الشحن غير موجودة" }, { status: 404 });
    }

    const carrierService = getCarrier(carrier.code);
    if (!carrierService) {
      return NextResponse.json({ error: "خدمة شركة الشحن غير متوفرة" }, { status: 400 });
    }

    // Create shipment with carrier API
    const carrierResult = await carrierService.createShipment(data);

    // Calculate pricing
    const rate = await prisma.carrierRate.findFirst({
      where: {
        carrierId: carrier.id,
        fromCity: data.senderCity,
        toCity: data.receiverCity,
      },
    });

    const costPrice = rate?.price || carrier.basePrice;
    const sellPrice = rate?.discountPrice || costPrice * (1 - carrier.discountPct / 100);

    const shipment = await prisma.shipment.create({
      data: {
        userId: (session!.user as { id: string }).id,
        storeId: data.storeId,
        orderId: data.orderId,
        carrierId: data.carrierId,
        trackingNumber: carrierResult.trackingNumber,
        status: carrierResult.success ? "PENDING" : "FAILED",
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        senderCity: data.senderCity,
        senderAddress: data.senderAddress,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        receiverCity: data.receiverCity,
        receiverAddress: data.receiverAddress,
        weight: data.weight,
        pieces: data.pieces,
        codAmount: data.codAmount,
        description: data.description,
        price: sellPrice,
        costPrice,
        labelUrl: carrierResult.labelUrl,
        carrierResponse: carrierResult.rawResponse as object || null,
      },
      include: { carrier: true },
    });

    return NextResponse.json({ shipment, carrierResult }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "حدث خطأ في إنشاء الشحنة" }, { status: 500 });
  }
}
