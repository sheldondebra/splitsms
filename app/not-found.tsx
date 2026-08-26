import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GoBackLink } from "@/components/errors/go-back-link";
import { Home, LifeBuoy } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <Logo size="lg" />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="mt-3 text-7xl font-bold tabular-nums tracking-tight text-foreground sm:text-8xl">
            404
          </h1>
          <p className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
            Page not found
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            The page you&apos;re looking for doesn&apos;t exist, was moved, or the link may be
            incorrect.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 rounded-xl font-semibold")}
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 gap-2 rounded-xl font-semibold",
              )}
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors"
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </Link>
            <span className="hidden sm:inline text-border">·</span>
            <Link href="/docs" className="font-medium hover:text-primary transition-colors">
              Documentation
            </Link>
            <span className="hidden sm:inline text-border">·</span>
            <GoBackLink />
          </div>
        </div>
      </main>
    </div>
  );
}
