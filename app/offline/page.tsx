import Link from "next/link";
import { WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200">
        <WifiOff className="h-5 w-5" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">You’re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        SplitSMS is saved on this device. Compose SMS and add contacts — they’ll sync
        automatically when the internet returns.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link href="/dashboard" className={cn(buttonVariants(), "rounded-xl")}>
          Try dashboard
        </Link>
        <Link
          href="/dashboard/send"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Compose SMS
        </Link>
      </div>
    </main>
  );
}
