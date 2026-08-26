import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { template, error } = await searchParams;

  const [groups, templates, tpl, senders, user, pricing] = await Promise.all([
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.smsTemplate.findMany({
      where: { userId: session.userId },
      orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    }),
    template
      ? prisma.smsTemplate.findFirst({
          where: { id: template, userId: session.userId },
        })
      : null,
    prisma.senderId.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { value: true, status: true, isDefault: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { countryCode: true },
    }),
    getWalletPricingOptions(session.userId),
  ]);

  const initialTemplates = tpl
    ? [{ ...tpl, content: tpl.content }, ...templates.filter((t) => t.id !== tpl.id)]
    : templates;

  const defaultCountry =
    user?.countryCode && user.countryCode !== "GLOBAL" ? user.countryCode : "GH";
  const defaultSender = senders.find((s) => s.status === "APPROVED" && s.isDefault)?.value
    ?? senders.find((s) => s.status === "APPROVED")?.value
    ?? "";

  const errorCopy =
    error === "credits"
      ? "Not enough SMS credits for this campaign."
      : error === "sender"
        ? "Pick an approved Sender ID before creating the campaign."
        : error === "invalid"
          ? "Add a message and at least one recipient, then try again."
          : error
            ? "Check the campaign details and try again."
            : null;

  return (
    <AppPage>
      <PageHeader
        title="New campaign"
        description="Name the campaign, pick who gets it, write the SMS, then send now or schedule."
        icon={Megaphone}
        mobileDescription="Name, audience, message, and schedule."
        actions={
          <Link
            href="/dashboard/campaigns"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 rounded-xl")}
          >
            <ArrowLeft className="h-4 w-4" />
            Campaigns
          </Link>
        }
      />

      {errorCopy ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorCopy}
        </p>
      ) : null}

      <AppCard className="overflow-visible">
        <AppCardBody>
          <CampaignForm
            groups={groups}
            templates={initialTemplates}
            senders={senders}
            countries={pricing.map((c) => ({
              countryCode: c.countryCode,
              countryName: c.countryName,
            }))}
            defaultSenderId={defaultSender}
            defaultCountryCode={
              pricing.some((c) => c.countryCode === defaultCountry) ? defaultCountry : "GH"
            }
            initialMessage={tpl?.content ?? ""}
          />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
