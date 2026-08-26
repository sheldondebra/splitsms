import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { getSenderIdVerificationContext } from "@/lib/actions/sender-id-verification";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Document submitted",
  description: "Your sender ID verification document was submitted for review.",
  path: "/sender-id/verify/success",
  noIndex: true,
});

export default async function SenderIdVerifySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const context = token ? await getSenderIdVerificationContext(token) : null;
  const value = context?.ok ? context.value : null;

  return (
    <AuthLayout
      title="Document submitted"
      subtitle="Thanks — we'll take it from here"
      sideDescription="Our team reviews verification documents as soon as they come in."
    >
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-amber-500/10 p-3">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Pending approval</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {value ? (
              <>
                Sender ID <span className="font-mono font-semibold text-foreground">{value}</span> is
                now pending approval while our team reviews your document.
              </>
            ) : (
              "Your sender ID is now pending approval while our team reviews your document."
            )}
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
