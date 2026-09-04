import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { SenderIdVerificationForm } from "@/components/sender-ids/sender-id-verification-form";
import { getSenderIdVerificationContext } from "@/lib/actions/sender-id-verification";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Verify sender ID",
  description: "Upload a verification document for your SplitSMS sender ID.",
  path: "/sender-id/verify",
  noIndex: true,
});

export default async function SenderIdVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <AuthLayout title="Verify sender ID" subtitle="This link is missing a token.">
        <AuthCard>
          <ErrorState message="This link is missing information. Please use the link from your email." />
        </AuthCard>
      </AuthLayout>
    );
  }

  const context = await getSenderIdVerificationContext(token);

  if (!context.ok) {
    return (
      <AuthLayout title="Verify sender ID" subtitle="This link is no longer valid.">
        <AuthCard>
          <ErrorState message="This link has expired or is invalid. Contact support and we'll send a new one." />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (context.alreadyApproved) {
    return (
      <AuthLayout title="Verify sender ID" subtitle={context.value}>
        <AuthCard>
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Already approved</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sender ID <span className="font-mono font-semibold text-foreground">{context.value}</span>{" "}
              is already approved — there&apos;s nothing more to submit.
            </p>
            <Link
              href="/dashboard/sender-ids"
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              Go to sender IDs
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your sender ID"
      subtitle={context.value}
      sideDescription="A quick document check helps us confirm who's sending SMS under this name."
    >
      <AuthCard>
        <div className="mb-5 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
        </div>

        {context.reason ? (
          <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
            {context.reason}
          </p>
        ) : null}

        {error ? (
          <p className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <SenderIdVerificationForm token={token} value={context.value} />
      </AuthCard>
    </AuthLayout>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Link expired</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Link href="/support" className="mt-6 text-sm font-medium text-primary hover:underline">
        Contact support
      </Link>
    </div>
  );
}
