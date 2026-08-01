import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient, SmsProviderType } from "../lib/generated/prisma/client";
import { COUNTRIES_DATA } from "../lib/countries-data";
import { getCountryDefaultCurrency } from "../lib/billing/country-currency";
import { seedSampleTemplatesForUser } from "../lib/sms/seed-templates";

const ADMIN = {
  fullName: "TecUnit Admin",
  email: "support@tecunitgh.com",
  phone: "+233200000001",
  countryCode: "GH",
  password: "#Awesome@123!",
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function routeOrderForCountry(code: string, mnotifyOnly: boolean): SmsProviderType[] {
  const countryDef = COUNTRIES_DATA.find((c) => c.code === code);
  const primary = countryDef?.defaultProvider ?? "INFOBIP";
  if (mnotifyOnly) return ["MNOTIFY"];
  const all: SmsProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];
  return [primary, ...all.filter((p) => p !== primary)];
}

async function main() {
  for (const type of ["MNOTIFY", "TWILIO", "INFOBIP"] as SmsProviderType[]) {
    await prisma.smsProvider.upsert({
      where: { type },
      update: {},
      create: {
        type,
        name: type.charAt(0) + type.slice(1).toLowerCase(),
        isActive: true,
      },
    });
  }

  const providers = await prisma.smsProvider.findMany();
  const byType = Object.fromEntries(providers.map((p) => [p.type, p.id]));
  const mnotifyOnly = process.env.MNOTIFY_FIRST !== "false";

  for (const c of COUNTRIES_DATA) {
    const country = await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, dialCode: c.dialCode },
      create: {
        code: c.code,
        name: c.name,
        dialCode: c.dialCode,
        isActive: true,
      },
    });

    const memberPrice =
      c.code === "GH" ? 0.05 : c.code === "NG" ? 0.045 : c.code === "GLOBAL" ? 0.015 : 0.05;
    const costPrice =
      c.code === "GH" ? 0.035 : c.code === "NG" ? 0.025 : c.code === "GLOBAL" ? 0.008 : 0.03;

    await prisma.smsPricing.upsert({
      where: { countryId: country.id },
      update: { memberPrice, costPrice, provider: c.code === "GH" ? "mNotify" : "Infobip" },
      create: {
        countryId: country.id,
        creditsPerSms: 1,
        memberPrice,
        costPrice,
        provider: c.code === "GH" ? "mNotify" : "Infobip",
        currency: getCountryDefaultCurrency(c.code),
      },
    });

    const routeOrder = routeOrderForCountry(c.code, mnotifyOnly);
    const route = await prisma.smsRoute.upsert({
      where: { countryId: country.id },
      update: {},
      create: { countryId: country.id },
    });

    await prisma.smsRouteStep.deleteMany({ where: { routeId: route.id } });
    for (let i = 0; i < routeOrder.length; i++) {
      await prisma.smsRouteStep.create({
        data: {
          routeId: route.id,
          providerId: byType[routeOrder[i]],
          priority: i + 1,
        },
      });
    }
  }

  await prisma.platformSetting.upsert({
    where: { key: "payment_methods" },
    update: {},
    create: {
      key: "payment_methods",
      value: ["PAYSTACK", "FLUTTERWAVE", "STRIPE", "MTN_MOMO", "MANUAL"],
    },
  });

  const passwordHash = await bcrypt.hash(ADMIN.password, 12);
  const adminUser = await prisma.user.upsert({
    where: { phone: ADMIN.phone },
    update: {
      fullName: ADMIN.fullName,
      email: ADMIN.email,
      passwordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
      countryCode: ADMIN.countryCode,
    },
    create: {
      fullName: ADMIN.fullName,
      email: ADMIN.email,
      phone: ADMIN.phone,
      countryCode: ADMIN.countryCode,
      passwordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
      wallet: { create: { currency: "GHS", balance: 0 } },
      smsCredit: { create: { balance: 1000 } },
    },
  });

  const templatesSeeded = await seedSampleTemplatesForUser(adminUser.id);

  const { ensureEmailMarketingTemplates } = await import(
    "../lib/admin/email-marketing-templates"
  );
  await ensureEmailMarketingTemplates();

  console.log(`Seed completed. ${COUNTRIES_DATA.length} countries with SMS routes.`);
  if (templatesSeeded > 0) {
    console.log(`Seeded ${templatesSeeded} sample SMS templates for admin.`);
  }
  console.log("Seeded email marketing system templates.");
  console.log(`Admin: ${ADMIN.email} / phone ${ADMIN.phone} (SUPER_ADMIN)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
