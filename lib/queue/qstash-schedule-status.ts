export type QstashScheduleStatus = {
  destination: string;
  label: string;
  cron: string;
  isPaused: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastRunOk: boolean | null;
};

const CRON_LABELS: Record<string, string> = {
  "/api/cron/process-sms": "Pending SMS processing",
  "/api/cron/sync-sender-ids": "Sender ID carrier sync",
  "/api/cron/google-forms-sms": "Google Forms SMS polling",
};

function labelForDestination(destination: string) {
  for (const [path, label] of Object.entries(CRON_LABELS)) {
    if (destination.endsWith(path)) return label;
  }
  try {
    return new URL(destination).pathname;
  } catch {
    return destination;
  }
}

/** Live status of the QStash-scheduled cron jobs. Safe to call from anywhere — never throws. */
export async function getQstashScheduleStatuses(): Promise<QstashScheduleStatus[]> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch("https://qstash.upstash.io/v2/schedules", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const schedules = (await res.json()) as Array<{
      destination: string;
      cron: string;
      isPaused: boolean;
      lastScheduleTime?: number;
      nextScheduleTime?: number;
      lastScheduleStates?: Record<string, string>;
    }>;

    return schedules.map((s) => {
      const states = Object.values(s.lastScheduleStates ?? {});
      return {
        destination: s.destination,
        label: labelForDestination(s.destination),
        cron: s.cron,
        isPaused: s.isPaused,
        lastRunAt: s.lastScheduleTime ? new Date(s.lastScheduleTime) : null,
        nextRunAt: s.nextScheduleTime ? new Date(s.nextScheduleTime) : null,
        lastRunOk: states.length > 0 ? states.every((state) => state === "SUCCESS") : null,
      };
    });
  } catch {
    return [];
  }
}
