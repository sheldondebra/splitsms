import "server-only";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { slugifyFormName } from "@/lib/smart-forms/slugify";

export async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomBytes(4).toString("base64url").slice(0, 6);
    const exists = await prisma.smartForm.findUnique({ where: { shortCode: code } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique short code");
}

export async function generateUniqueSlug(userId: string, name: string): Promise<string> {
  const base = slugifyFormName(name);
  let slug = base;
  let suffix = 1;

  while (true) {
    const exists = await prisma.smartForm.findUnique({
      where: { userId_slug: { userId, slug } },
    });
    if (!exists) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}
