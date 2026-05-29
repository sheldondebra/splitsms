import {
  checkMnotifySenderIdStatus,
  isMnotifyConfigured,
  registerMnotifySenderId,
} from "@/lib/mnotify";
import type { ProviderRegistrationResult } from "@/lib/sender-ids/types";
import { mapProviderStatusText } from "@/lib/sender-ids/provider-registrations";

export async function submitSenderIdToMnotify(senderName: string, purpose: string) {
  const registered = await registerMnotifySenderId(senderName, purpose);
  if (registered.ok) {
    return registered;
  }

  const status = await checkMnotifySenderIdStatus(senderName);
  if (status.ok && status.providerStatus) {
    return status;
  }

  return registered;
}

export async function registerMnotifySenderRegistration(
  value: string,
  purpose: string,
): Promise<ProviderRegistrationResult> {
  if (!(await isMnotifyConfigured())) {
    return {
      status: "SKIPPED",
      providerStatus: "mNotify not configured",
      skipped: true,
    };
  }

  const result = await submitSenderIdToMnotify(value, purpose);

  if (!result.ok) {
    return {
      status: "FAILED",
      error: result.error ?? "mNotify registration failed",
      providerStatus: result.providerStatus,
    };
  }

  return {
    status: mapProviderStatusText(result.providerStatus ?? "Pending"),
    providerStatus: result.providerStatus ?? "Pending",
  };
}

export async function syncMnotifySenderRegistration(
  value: string,
): Promise<ProviderRegistrationResult> {
  if (!(await isMnotifyConfigured())) {
    return { status: "SKIPPED", skipped: true };
  }

  const status = await checkMnotifySenderIdStatus(value);
  if (!status.ok) {
    return {
      status: "FAILED",
      error: status.error ?? "Could not check mNotify status",
    };
  }

  return {
    status: mapProviderStatusText(status.providerStatus),
    providerStatus: status.providerStatus,
  };
}
