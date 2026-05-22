import { countSmsUnits, isGsm7 } from "@/lib/sms/units";

export type MessagePreview = {
  characters: number;
  segments: number;
  encoding: "GSM-7" | "Unicode";
  isUnicode: boolean;
};

export function getMessagePreview(text: string): MessagePreview {
  const gsm = isGsm7(text);
  return {
    characters: text.length,
    segments: countSmsUnits(text),
    encoding: gsm ? "GSM-7" : "Unicode",
    isUnicode: !gsm,
  };
}

export function estimateCampaignCost(
  message: string,
  recipientCount: number,
  costPerUnit: number,
) {
  const segments = countSmsUnits(message);
  const totalUnits = segments * recipientCount;
  return {
    segments,
    recipientCount,
    totalUnits,
    estimatedCost: costPerUnit * totalUnits,
  };
}
