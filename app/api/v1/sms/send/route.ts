import { withApi } from "@/lib/api/with-api";
import { apiSendMessages } from "@/lib/api/send-message";
import { apiError } from "@/lib/api/errors";
import { z } from "zod";

const schema = z.object({
  sender: z.string().optional(),
  from: z.string().optional(),
  message: z.string().min(1),
  to: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  countryCode: z.string().default("GH"),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid payload", 400);
    }

    const sender = body.data.sender ?? body.data.from ?? "SplitSMS";
    const recipientList = body.data.recipients?.length
      ? body.data.recipients
      : body.data.to
        ? [body.data.to]
        : [];

    return apiSendMessages(ctx, {
      sender,
      message: body.data.message,
      recipients: recipientList,
      countryCode: body.data.countryCode,
    });
  },
  "/api/v1/sms/send",
  "sms.send",
);
