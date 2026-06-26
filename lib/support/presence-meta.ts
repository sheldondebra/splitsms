export type SupportPresenceStatus = "ONLINE" | "OFFLINE" | "BUSY";

export type SupportPresence = {
  status: SupportPresenceStatus;
  label: string;
  detail: string;
  updatedAt?: string;
};

const STATUS_META: Record<
  SupportPresenceStatus,
  Pick<SupportPresence, "label" | "detail">
> = {
  ONLINE: {
    label: "Online",
    detail: "Live · scroll for history",
  },
  OFFLINE: {
    label: "Offline",
    detail: "Away · we'll reply when we're back",
  },
  BUSY: {
    label: "Busy",
    detail: "Busy · responses may take longer",
  },
};

export function isSupportPresenceStatus(value: string): value is SupportPresenceStatus {
  return value === "ONLINE" || value === "OFFLINE" || value === "BUSY";
}

export function supportPresenceDotClass(status: SupportPresenceStatus) {
  switch (status) {
    case "ONLINE":
      return "bg-emerald-500 animate-pulse";
    case "OFFLINE":
      return "bg-destructive";
    case "BUSY":
      return "bg-amber-400";
  }
}

export function formatSupportPresence(status: SupportPresenceStatus): SupportPresence {
  const meta = STATUS_META[status];
  return { status, ...meta };
}
