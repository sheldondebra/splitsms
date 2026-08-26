import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { unsubscribeNewsletter } from "@/lib/newsletter/subscribe";
import { newsletterUnsubscribeTokenValid } from "@/lib/newsletter/unsubscribe-token";

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  const email = String(params.email ?? "").trim().toLowerCase();
  const token = String(params.token ?? "");
  const valid = email && token && newsletterUnsubscribeTokenValid(email, token);
  const removed = valid ? await unsubscribeNewsletter(email) : false;

  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
        {valid ? (
          <p className="mt-4 text-muted-foreground">
            {removed
              ? `${email} is off the list. You can subscribe again from any page footer.`
              : `${email} was already unsubscribed or not on the list.`}
          </p>
        ) : (
          <p className="mt-4 text-muted-foreground">
            This unsubscribe link is invalid or expired. Use the link from a newsletter email.
          </p>
        )}
      </div>
    </MarketingPageShell>
  );
}
