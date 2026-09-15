import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default async function EmailMarketingUnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok !== "0";

  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Email preferences</h1>
        <p className="mt-4 text-muted-foreground">
          {success
            ? "You are unsubscribed from SplitSMS marketing emails. Transactional messages such as login codes may still be sent."
            : "This unsubscribe link is invalid or expired. Use the link from a recent campaign email."}
        </p>
      </div>
    </MarketingPageShell>
  );
}
