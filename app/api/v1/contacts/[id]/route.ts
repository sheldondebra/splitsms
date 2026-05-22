import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";

function contactIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().nullable(),
  tags: z.string().optional().nullable(),
  countryCode: z.string().optional(),
});

export const PUT = withApi(
  async (request, ctx) => {
    const id = contactIdFromUrl(request);
    const body = updateSchema.safeParse(await request.json());
    if (!body.success) return apiError("INVALID_REQUEST", "Invalid payload", 400);

    const existing = await prisma.contact.findFirst({
      where: { id, userId: ctx.user.id },
    });
    if (!existing) return apiError("NOT_FOUND", "Contact not found", 404);

    const contact = await prisma.contact.update({
      where: { id },
      data: body.data,
    });

    return apiSuccess({ data: contact });
  },
  "/api/v1/contacts/:id",
  "contacts.write",
);

export const DELETE = withApi(
  async (request, ctx) => {
    const id = contactIdFromUrl(request);
    const deleted = await prisma.contact.deleteMany({
      where: { id, userId: ctx.user.id },
    });
    if (deleted.count === 0) return apiError("NOT_FOUND", "Contact not found", 404);
    return apiSuccess({ deleted: true });
  },
  "/api/v1/contacts/:id",
  "contacts.write",
);
