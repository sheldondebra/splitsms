import Link from "next/link";

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

  return (
    <p className="mb-5 text-center text-sm text-muted-foreground">
      <Link href={alternateHref} className="text-primary font-medium hover:underline">
        {mode === "email" ? "Use phone number" : "Use email"}
      </Link>
      <span className="mx-2 text-border" aria-hidden="true">
        ·
      </span>
      <Link href={smsHref} className="text-primary font-medium hover:underline">
        Sign in with SMS / email code
      </Link>
    </p>
  );
}
