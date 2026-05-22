import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { verifyOtp } from "@/lib/auth/otp";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid payload", 400);
    }

    if (ctx.isSandbox && body.data.code === "123456") {
      return apiSuccess({ ok: true, verified: true, sandbox: true });
    }

    const result = await verifyOtp(body.data.phone, body.data.code, "LOGIN");
    if (!result.ok) {
      return apiError("INVALID_REQUEST", result.error ?? "Invalid code", 400);
    }

    return apiSuccess({ ok: true, verified: true });
  },
  "/api/v1/otp/verify",
  "sms.send",
);
