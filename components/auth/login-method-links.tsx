import Link from "next/link";
import { Mail, MessageSquareText, Phone } from "lucide-react";

function withReturnTo(path: string, returnTo?: string) {
  if (!returnTo) return path;
  const url = new URL(path, "http://localhost");
  url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}${url.search}`;
}

export function LoginMethodLinks({
  mode,
  returnTo,
}: {
  mode: "email" | "phone";
  returnTo?: string;
}) {
  const alternateHref =
    mode === "email"
      ? withReturnTo("/login?mode=password&phone=1", returnTo)
      : withReturnTo("/login", returnTo);
  const smsHref = withReturnTo("/login?mode=sms", returnTo);

  const AlternateIcon = mode === "email" ? Phone : Mail;

  return (
    <div className="mb-5 grid grid-cols-2 gap-2">
      <Link
        href={alternateHref}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 hover:border-border"
      >
        <AlternateIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {mode === "email" ? "Phone" : "Email"}
      </Link>
      <Link
        href={smsHref}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 hover:border-border"
      >
        <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        SMS code
      </Link>
    </div>
  );
}
