import { handlePublicSendOtp } from "@/lib/api/public-auth";

/** Sprint doc alias → same as POST /api/v1/otp/send (no API key; rate-limited by phone) */
export async function POST(request: Request) {
  return handlePublicSendOtp(request);
}
