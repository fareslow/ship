import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { zidIntegration } from "@/lib/integrations";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  const store = await prisma.store.findFirst({
    where: { userId, platform: "ZID" },
  });

  if (!store) {
    return NextResponse.json({
      connected: false,
      authUrl: zidIntegration.getAuthUrl(),
    });
  }

  return NextResponse.json({ connected: true, store });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;
  const { code } = await req.json();

  try {
    const tokens = await zidIntegration.exchangeCode(code);
    const storeInfo = await zidIntegration.getStoreInfo(tokens.accessToken);

    const store = await prisma.store.upsert({
      where: {
        userId_platform_platformStoreId: {
          userId,
          platform: "ZID",
          platformStoreId: String((storeInfo as Record<string, unknown>).id || "zid"),
        },
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isActive: true,
      },
      create: {
        userId,
        name: String((storeInfo as Record<string, unknown>).name || "متجر زد"),
        platform: "ZID",
        platformStoreId: String((storeInfo as Record<string, unknown>).id || "zid"),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json(
      { error: `فشل ربط متجر زد: ${(err as Error).message}` },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  await prisma.store.updateMany({
    where: { userId, platform: "ZID" },
    data: { isActive: false, accessToken: null, refreshToken: null },
  });

  return NextResponse.json({ message: "تم فصل متجر زد بنجاح" });
}
