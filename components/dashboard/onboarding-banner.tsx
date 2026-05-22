import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingBannerProps = {
  phoneVerified: boolean;
  hasBalance: boolean;
  hasSenderId: boolean;
  hasSentMessage: boolean;
};

export function OnboardingBanner({
  phoneVerified,
  hasBalance,
  hasSenderId,
  hasSentMessage,
}: OnboardingBannerProps) {
  if (phoneVerified && hasBalance && hasSenderId && hasSentMessage) return null;

  const steps = [
    {
      done: phoneVerified,
      label: "Verify your number",
      href: "/dashboard/settings",
    },
    {
      done: hasBalance,
      label: "Add balance",
      href: "/dashboard/wallet",
    },
    {
      done: hasSenderId,
      label: "Set up Sender ID",
      href: "/dashboard/sender-ids",
    },
    {
      done: hasSentMessage,
      label: "Send your first SMS",
      href: "/dashboard/send",
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold">Get started</p>
      <ul className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                step.done ? "text-muted-foreground" : "font-medium hover:text-primary",
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span>
                Step {i + 1} — {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
