import Link from "next/link";

export function ResellerFooter({ brandName }: { brandName?: string | null }) {
  const year = new Date().getFullYear();
  const brand = brandName?.trim() || "Reseller Portal";

  return (
    <footer className="shrink-0 border-t border-border/70 bg-muted/20">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{brand}</p>
          <p className="text-xs text-muted-foreground">
            © {year} · Powered by{" "}
            <Link href="/" className="font-medium text-foreground/80 hover:text-primary hover:underline">
              SplitSMS
            </Link>
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
          <Link href="/reseller/wallet" className="hover:text-foreground">
            Wallet
          </Link>
          <Link href="/reseller/users" className="hover:text-foreground">
            Clients
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
        </nav>
      </div>
    </footer>
  );
}
