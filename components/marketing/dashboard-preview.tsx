import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  LayoutDashboard,
  Megaphone,
  Send,
  Wallet,
} from "lucide-react";

type PreviewVariant = "overview" | "send" | "campaigns";

const navItems = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: Send, label: "Send SMS" },
  { icon: Megaphone, label: "Campaigns" },
  { icon: BadgeCheck, label: "Sender IDs" },
  { icon: Wallet, label: "Wallet" },
];

function isNavActive(label: string, variant: PreviewVariant) {
  if (variant === "overview" && label === "Overview") return true;
  if (variant === "send" && label === "Send SMS") return true;
  if (variant === "campaigns" && label === "Campaigns") return true;
  return false;
}

function Sidebar({ variant }: { variant: PreviewVariant }) {
  return (
    <div className="hidden sm:flex w-[140px] shrink-0 flex-col border-r border-border/60 bg-muted/30">
      <div className="flex h-10 items-center border-b border-border/60 px-3">
        <div className="h-5 w-16 rounded bg-primary/20" />
      </div>
      <div className="space-y-0.5 p-2">
        {navItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium",
              isNavActive(label, variant)
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div>
        <p className="text-[11px] font-semibold">Good morning, Kofi</p>
        <p className="text-[9px] text-muted-foreground">Your SMS activity at a glance</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Sent today", value: "248" },
          { label: "Delivery rate", value: "98.4%" },
          { label: "Balance", value: "$42.50" },
          { label: "Campaigns", value: "3 active" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border/50 bg-card px-2.5 py-2">
            <p className="text-[8px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-bold tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border/50 bg-card p-2.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-semibold">SMS volume</p>
          <p className="text-[8px] text-muted-foreground">Last 14 days</p>
        </div>
        <div className="flex items-end gap-1 h-16">
          {[32, 48, 40, 56, 44, 72, 68, 52, 80, 64, 76, 88, 72, 96].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SendPanel() {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div>
        <p className="text-[11px] font-semibold">Send SMS</p>
        <p className="text-[9px] text-muted-foreground">Quick message to your contacts</p>
      </div>
      <div className="rounded-lg border border-border/50 bg-card p-2.5 space-y-2">
        <div>
          <p className="text-[8px] text-muted-foreground mb-1">Sender ID</p>
          <div className="h-7 rounded-md border border-border/60 bg-muted/40 px-2 flex items-center text-[9px] font-medium">
            MYBRAND
          </div>
        </div>
        <div>
          <p className="text-[8px] text-muted-foreground mb-1">Recipients</p>
          <div className="h-7 rounded-md border border-border/60 bg-muted/40 px-2 flex items-center text-[9px] text-muted-foreground">
            +233 24 123 4567, +233 55 987 6543
          </div>
        </div>
        <div>
          <p className="text-[8px] text-muted-foreground mb-1">Message</p>
          <div className="min-h-[52px] rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[9px] leading-relaxed">
            Hi {"{{name}}"}, your order is ready for pickup. Thank you for shopping with us!
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-[8px] text-muted-foreground">2 recipients · 1 segment · $0.10</p>
          <div className="h-6 rounded-md bg-primary px-3 flex items-center text-[9px] font-semibold text-primary-foreground">
            Send now
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignsPanel() {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold">Campaigns</p>
          <p className="text-[9px] text-muted-foreground">Track bulk SMS progress</p>
        </div>
        <div className="h-6 rounded-md bg-primary/10 px-2 flex items-center text-[8px] font-semibold text-primary">
          New campaign
        </div>
      </div>
      {[
        { name: "Weekend promo", sent: 842, total: 1000, status: "Running" },
        { name: "Payment reminders", sent: 1200, total: 1200, status: "Done" },
      ].map((c) => (
        <div key={c.name} className="rounded-lg border border-border/50 bg-card p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-semibold">{c.name}</p>
            <span className="text-[8px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
              {c.status}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(c.sent / c.total) * 100}%` }}
            />
          </div>
          <p className="text-[8px] text-muted-foreground mt-1">
            {c.sent.toLocaleString()} / {c.total.toLocaleString()} sent
          </p>
        </div>
      ))}
    </div>
  );
}

export function DashboardPreview({
  variant = "overview",
  className,
  label,
}: {
  variant?: PreviewVariant;
  className?: string;
  label?: string;
}) {
  return (
    <figure className={cn("relative", className)}>
      {label && <figcaption className="sr-only">{label}</figcaption>}
      <div className="rounded-xl border border-border/70 bg-card shadow-2xl shadow-black/10 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="h-5 w-[min(100%,12rem)] rounded-md bg-background/80 border border-border/50 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">app.splitsms.com/dashboard</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-[220px] sm:min-h-[280px] bg-background">
          <Sidebar variant={variant} />
          <div className="flex-1 min-w-0">
            {variant === "overview" && <OverviewPanel />}
            {variant === "send" && <SendPanel />}
            {variant === "campaigns" && <CampaignsPanel />}
          </div>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-center text-xs text-muted-foreground font-medium">{label}</p>
      )}
    </figure>
  );
}

export function DashboardPreviewStrip() {
  const items: { variant: PreviewVariant; label: string }[] = [
    { variant: "overview", label: "Dashboard overview" },
    { variant: "send", label: "Send SMS" },
    { variant: "campaigns", label: "Campaigns" },
  ];

  return (
    <div className="-mx-4 px-4 overflow-x-auto pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:pb-0">
      <div className="flex gap-5 w-max md:w-full md:grid md:grid-cols-3 md:gap-6">
        {items.map(({ variant, label }) => (
          <div key={variant} className="w-[min(85vw,320px)] shrink-0 snap-center md:w-auto md:shrink">
            <DashboardPreview variant={variant} label={label} />
          </div>
        ))}
      </div>
    </div>
  );
}
