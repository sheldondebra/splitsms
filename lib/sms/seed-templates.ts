import { prisma } from "@/lib/db";
import { SAMPLE_SMS_TEMPLATES } from "@/lib/sms/template-samples";

export async function seedSampleTemplatesForUser(userId: string) {
  const count = await prisma.smsTemplate.count({ where: { userId } });
  if (count > 0) return 0;

  await prisma.$transaction(
    SAMPLE_SMS_TEMPLATES.map((t) =>
      prisma.smsTemplate.create({
        data: {
          userId,
          name: t.name,
          content: t.content,
          isFavorite: t.isFavorite,
        },
      }),
    ),
  );
  return SAMPLE_SMS_TEMPLATES.length;
}
