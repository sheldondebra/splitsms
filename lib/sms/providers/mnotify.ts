import { sendMnotifyQuickSms } from "@/lib/mnotify";
import type { SendParams, SendResult, SmsProviderAdapter } from "./types";

export async function sendViaMnotify(params: SendParams): Promise<SendResult> {
  const result = await sendMnotifyQuickSms({
    recipients: [params.to],
    sender: params.from,
    message: params.body,
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    providerRef: result.providerRef,
  };
}

export const mnotifyAdapter: SmsProviderAdapter = {
  type: "MNOTIFY",
  send: sendViaMnotify,
};
