import {
  checkReservedSenderIdAsync,
  isValueAdminBanned,
  loadSenderIdReservedConfig,
  bannedSenderIdMessage,
  reservedSenderIdMessage,
} from "@/lib/sender-ids/reserved-names";
import {
  normalizeSenderIdValue,
  SENDER_ID_MAX_LENGTH,
  SENDER_ID_MIN_LENGTH,
  validateSenderIdFormat,
  validateSenderIdValue,
} from "@/lib/sender-ids/format";

export {
  normalizeSenderIdValue,
  SENDER_ID_MAX_LENGTH,
  SENDER_ID_MIN_LENGTH,
  validateSenderIdFormat,
  validateSenderIdValue,
};

export type ValidateSenderIdOptions = {
  countryCode?: string;
  /** Admin override — only when authorization is verified. */
  allowReserved?: boolean;
};

export async function validateSenderIdForRegistration(
  value: string,
  options?: ValidateSenderIdOptions,
): Promise<
  | { ok: true }
  | { ok: false; error: string; code: "invalid" | "reserved" | "banned" }
> {
  const format = validateSenderIdFormat(value);
  if (!format.ok) return format;

  const reserved = await checkReservedSenderIdAsync(value, {
    countryCode: options?.countryCode,
    allowReserved: options?.allowReserved,
  });
  if (reserved.blocked) {
    const config = await loadSenderIdReservedConfig();
    const isBanned = isValueAdminBanned(value, config);
    return {
      ok: false,
      error: isBanned
        ? bannedSenderIdMessage(reserved.matched)
        : reservedSenderIdMessage(reserved.matched),
      code: isBanned ? "banned" : "reserved",
    };
  }

  return { ok: true };
}
