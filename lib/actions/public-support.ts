"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  category: z.enum([
    "bug",
    "error",
    "billing",
    "api",
    "wordpress",
    "account",
    "feature",
    "other",
  ]),
  subject: z.string().trim().min(3, "Add a short subject").max(200),
  message: z.string().trim().min(20, "Please describe the issue in more detail").max(8000),
});

export type PublicSupportState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof inquirySchema>, string>>;
};

export async function submitPublicSupportAction(
  _prev: PublicSupportState,
  formData: FormData,
): Promise<PublicSupportState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    category: formData.get("category"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: PublicSupportState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof inquirySchema>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const session = await getSession();
  const data = parsed.data;

  await prisma.auditLog.create({
    data: {
      actorId: session?.userId,
      action: "SUPPORT_INQUIRY",
      entityType: "public_support",
      metadata: {
        name: data.name,
        email: data.email,
        category: data.category,
        subject: data.subject,
        message: data.message,
      },
    },
  });

  redirect("/support?sent=1");
}
