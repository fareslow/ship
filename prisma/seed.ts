import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@shippro.sa" },
    update: {},
    create: {
      email: "admin@shippro.sa",
      name: "مدير النظام",
      password: hashedPassword,
      role: "ADMIN",
      companyName: "ShipPro",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create carriers
  const carriers = [
    {
      code: "SMSA" as const,
      name: "SMSA Express",
      nameAr: "سمسا إكسبريس",
      basePrice: 25,
      discountPct: 30,
    },
    {
      code: "ARAMEX" as const,
      name: "Aramex",
      nameAr: "أرامكس",
      basePrice: 28,
      discountPct: 25,
    },
    {
      code: "DHL" as const,
      name: "DHL Express",
      nameAr: "دي إتش إل",
      basePrice: 35,
      discountPct: 20,
    },
    {
      code: "SPL" as const,
      name: "Saudi Post (SPL)",
      nameAr: "البريد السعودي",
      basePrice: 18,
      discountPct: 15,
    },
  ];

  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { id: carrier.code.toLowerCase() },
      update: carrier,
      create: { id: carrier.code.toLowerCase(), ...carrier },
    });
    console.log("Created carrier:", carrier.name);
  }

  // Create sample carrier rates
  const cities = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "أبها", "تبوك", "حائل"];

  for (const carrier of carriers) {
    for (const fromCity of cities) {
      for (const toCity of cities) {
        if (fromCity === toCity) continue;
        const baseRate = carrier.basePrice + Math.random() * 10;
        await prisma.carrierRate.upsert({
          where: {
            carrierId_fromCity_toCity_weight: {
              carrierId: carrier.code.toLowerCase(),
              fromCity,
              toCity,
              weight: 1,
            },
          },
          update: {},
          create: {
            carrierId: carrier.code.toLowerCase(),
            fromCity,
            toCity,
            weight: 1,
            price: Math.round(baseRate * 100) / 100,
            discountPrice: Math.round(baseRate * (1 - carrier.discountPct / 100) * 100) / 100,
            estimatedDays: Math.ceil(Math.random() * 3) + 1,
          },
        });
      }
    }
    console.log(`Created rates for ${carrier.name}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
