import Link from "next/link";
import { ListChecks } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  featureDisabledMessage,
  platformFeatureLabel,
  type PlatformFeatureId,
} from "@/lib/platform/feature-catalog";

export function FeatureUnavailable({ feature }: { feature: PlatformFeatureId }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ListChecks className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        {platformFeatureLabel(feature)} is unavailable
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {featureDisabledMessage(feature)} If you need this, contact support.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "mt-6 h-10")}
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export function FeatureInlineNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-5 py-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
