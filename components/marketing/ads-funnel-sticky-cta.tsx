import { FunnelCta } from "@/components/marketing/ads-funnel-cta";

export function AdsFunnelStickyCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[oklch(0.13_0_0)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <FunnelCta href={href} label={label} className="h-12 w-full justify-center" />
    </div>
  );
}
