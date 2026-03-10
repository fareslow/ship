import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const fromCity = searchParams.get("fromCity");
  const toCity = searchParams.get("toCity");
  const weight = parseFloat(searchParams.get("weight") || "1");

  if (!fromCity || !toCity) {
    return NextResponse.json({ error: "يرجى تحديد مدينة المرسل والمستلم" }, { status: 400 });
  }

  const rates = await prisma.carrierRate.findMany({
    where: {
      fromCity: { equals: fromCity, mode: "insensitive" },
      toCity: { equals: toCity, mode: "insensitive" },
      weight: { gte: weight },
      carrier: { isActive: true },
    },
    include: { carrier: true },
    orderBy: { discountPrice: "asc" },
  });

  // If no exact rates, return carrier base prices
  if (rates.length === 0) {
    const carriers = await prisma.carrier.findMany({
      where: { isActive: true },
    });

    const baseRates = carriers.map((carrier) => ({
      carrierId: carrier.id,
      carrierName: carrier.name,
      carrierCode: carrier.code,
      price: carrier.basePrice,
      discountPrice: carrier.basePrice * (1 - carrier.discountPct / 100),
      currency: "SAR",
      estimatedDays: 3,
    }));

    return NextResponse.json({ rates: baseRates });
  }

  const formattedRates = rates.map((rate) => ({
    carrierId: rate.carrier.id,
    carrierName: rate.carrier.name,
    carrierCode: rate.carrier.code,
    price: rate.price,
    discountPrice: rate.discountPrice,
    currency: rate.currency,
    estimatedDays: rate.estimatedDays,
  }));

  return NextResponse.json({ rates: formattedRates });
}
