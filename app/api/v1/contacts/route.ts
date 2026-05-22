import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { buildContactWhere } from "@/lib/contacts/segment";
import { normalizePhones } from "@/lib/sms/units";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { z } from "zod";

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

    const contacts = await prisma.contact.findMany({
      where: buildContactWhere(ctx.user.id, {
        q: url.searchParams.get("q") ?? undefined,
        countryCode: url.searchParams.get("country") ?? undefined,
        tag: url.searchParams.get("tag") ?? undefined,
        groupId: url.searchParams.get("groupId") ?? undefined,
      }),
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiSuccess({ data: contacts });
  },
  "/api/v1/contacts",
  "contacts.read",
);

const createSchema = z.object({
  name: z.string().optional(),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  tags: z.string().optional(),
  countryCode: z.string().optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = createSchema.safeParse(await request.json());
    if (!body.success) return apiError("INVALID_REQUEST", "Invalid contact data", 400);

    const phone = normalizePhones(body.data.phone)[0];
    if (!phone) return apiError("INVALID_REQUEST", "Invalid phone number", 400);

    const contact = await prisma.contact.upsert({
      where: { userId_phone: { userId: ctx.user.id, phone } },
      update: {
        name: body.data.name,
        email: body.data.email,
        tags: body.data.tags,
        countryCode: body.data.countryCode ?? detectCountryCode(phone),
      },
      create: {
        userId: ctx.user.id,
        phone,
        name: body.data.name,
        email: body.data.email,
        tags: body.data.tags,
        countryCode: body.data.countryCode ?? detectCountryCode(phone),
      },
    });

    return apiSuccess({ data: contact }, 201);
  },
  "/api/v1/contacts",
  "contacts.write",
);
