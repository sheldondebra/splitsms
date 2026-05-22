import { handlePublicVerifyOtp } from "@/lib/api/public-auth";

/** Sprint doc alias → verifies OTP for signup / login / reset flows */
export async function POST(request: Request) {
  return handlePublicVerifyOtp(request);
}
