import { NextResponse } from "next/server";
import { resendMemberSmsViaProvider } from "@/lib/admin/resend-member-sms";
import { revalidatePath } from "next/cache";

export const maxDuration = 300;

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; deductCredits?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const result = await resendMemberSmsViaProvider(email, {
      provider: "MNOTIFY",
      deductCredits: body.deductCredits ?? false,
      batchSize: 80,
      maxRounds: 15,
    });

    revalidatePath("/admin/messages");

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
