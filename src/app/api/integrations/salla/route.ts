import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { sallaIntegration } from "@/lib/integrations";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  const store = await prisma.store.findFirst({
    where: { userId, platform: "SALLA" },
  });

  if (!store) {
    return NextResponse.json({
      connected: false,
      authUrl: sallaIntegration.getAuthUrl(),
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
    const tokens = await sallaIntegration.exchangeCode(code);
    const storeInfo = await sallaIntegration.getStoreInfo(tokens.accessToken);
    const data = (storeInfo as { data?: Record<string, unknown> }).data || storeInfo;

    const store = await prisma.store.upsert({
      where: {
        userId_platform_platformStoreId: {
          userId,
          platform: "SALLA",
          platformStoreId: String((data as Record<string, unknown>).id || "salla"),
        },
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isActive: true,
      },
      create: {
        userId,
        name: String((data as Record<string, unknown>).name || "متجر سلة"),
        platform: "SALLA",
        platformStoreId: String((data as Record<string, unknown>).id || "salla"),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        domain: String((data as Record<string, unknown>).domain || ""),
      },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json(
      { error: `فشل ربط متجر سلة: ${(err as Error).message}` },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as { id: string }).id;

  await prisma.store.updateMany({
    where: { userId, platform: "SALLA" },
    data: { isActive: false, accessToken: null, refreshToken: null },
  });

  return NextResponse.json({ message: "تم فصل متجر سلة بنجاح" });
}
