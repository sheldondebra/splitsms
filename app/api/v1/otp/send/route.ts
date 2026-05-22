import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { createAndSendOtp } from "@/lib/auth/otp";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10),
  message: z.string().optional(),
  countryCode: z.string().min(2).max(10).optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    if (ctx.isSandbox) {
      return apiSuccess({
        ok: true,
        message: "OTP sent (sandbox — no SMS delivered)",
        sandbox: true,
        code_hint: "123456",
      });
    }

    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid phone", 400);
    }

    const result = await createAndSendOtp(
      body.data.phone,
      "LOGIN",
      body.data.countryCode ?? "GH",
    );
    if (!result.ok) {
      return apiError("RATE_LIMITED", "Wait before requesting another code", 429, {
        cooldown_sec: result.cooldownSec,
      });
    }
    return apiSuccess({ ok: true, message: "OTP sent" });
  },
  "/api/v1/otp/send",
  "sms.send",
);
