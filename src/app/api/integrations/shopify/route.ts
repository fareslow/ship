import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { shopifyIntegration } from "@/lib/integrations";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  const store = await prisma.store.findFirst({
    where: { userId, platform: "SHOPIFY" },
  });

  if (!store) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({ connected: true, store });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;
  const { shop, code } = await req.json();

  try {
    const { accessToken } = await shopifyIntegration.exchangeCode(shop, code);
    const shopInfo = await shopifyIntegration.getShopInfo(shop, accessToken);
    const shopData = (shopInfo as { shop?: Record<string, unknown> }).shop || shopInfo;

    const store = await prisma.store.upsert({
      where: {
        userId_platform_platformStoreId: {
          userId,
          platform: "SHOPIFY",
          platformStoreId: shop,
        },
      },
      update: { accessToken, isActive: true },
      create: {
        userId,
        name: String((shopData as Record<string, unknown>).name || shop),
        platform: "SHOPIFY",
        platformStoreId: shop,
        accessToken,
        domain: shop,
      },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json(
      { error: `فشل ربط متجر شوبيفاي: ${(err as Error).message}` },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  await prisma.store.updateMany({
    where: { userId, platform: "SHOPIFY" },
    data: { isActive: false, accessToken: null },
  });

  return NextResponse.json({ message: "تم فصل متجر شوبيفاي بنجاح" });
}
