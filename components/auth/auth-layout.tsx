import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  sideTitle?: React.ReactNode;
  sideDescription?: string;
  sideBadge?: string;
};

export function AuthLayout({
  children,
  title,
  subtitle,
  sideTitle,
  sideDescription,
  sideBadge,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[46%] hero-gradient text-white flex-col justify-between p-12 xl:p-14">
        <Logo href="/" size="lg" variant="white" />
        <div className="space-y-4 max-w-md">
          {sideBadge && (
            <p className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {sideBadge}
            </p>
          )}
          <div className="text-3xl font-bold tracking-tight leading-tight">
            {sideTitle ?? (
              <>
                Bulk SMS made <span className="text-primary">simple</span>
              </>
            )}
          </div>
          {sideDescription && (
            <p className="text-white/60 text-base leading-relaxed">{sideDescription}</p>
          )}
        </div>
        <p className="text-xs text-white/40">© SplitSMS · Tecunit Ghana · Secure login</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 bg-muted/30">
        <div className="lg:hidden mb-8">
          <Logo href="/" size="md" />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthFooterLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      <Link href={href} className="text-primary font-medium hover:underline">
        {children}
      </Link>
    </p>
  );
}
