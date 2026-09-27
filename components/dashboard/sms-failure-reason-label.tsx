import { cn } from "@/lib/utils";
import { toMemberFacingFailureReason } from "@/lib/sms/friendly-failure";

const FAIL_STATUSES = new Set(["FAILED", "REJECTED", "EXPIRED"]);

/** Compact label showing why an SMS failed — visible without expanding the row. */
export function SmsFailureReasonLabel({
  status,
  reason,
  className,
}: {
  status: string;
  reason: string | null | undefined;
  className?: string;
}) {
  if (!FAIL_STATUSES.has(status)) return null;

  const text = toMemberFacingFailureReason(reason);

  return (
    <p
      className={cn(
        "mt-1 max-w-[16rem] truncate rounded-md border border-destructive/25 bg-destructive/5 px-1.5 py-0.5 text-[10px] leading-snug text-destructive",
        className,
      )}
      title={text}
    >
      {text}
    </p>
  );
}
