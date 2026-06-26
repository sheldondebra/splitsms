import { redirect } from "next/navigation";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSession } from "@/lib/auth/session";
import { getOnboardingSnapshot, userNeedsOnboarding } from "@/lib/onboarding";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== "MEMBER") {
    redirect("/dashboard");
  }

  if (!(await userNeedsOnboarding(session.userId))) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const snapshot = await getOnboardingSnapshot(session.userId);
  const stepParam = params.step === "2" ? 2 : 1;
  const initialStep = snapshot.hasSenderId && stepParam === 1 ? 2 : stepParam;

  return (
    <AuthLayout
      title={`Welcome, ${snapshot.firstName}`}
      subtitle="Two quick steps before you send your first SMS"
      sideDescription="Register your brand name so recipients know who messaged them, then add wallet funds or credits when you're ready."
      sideBadge="Getting started"
    >
      <AuthCard>
        <OnboardingWizard
          firstName={snapshot.firstName}
          creditBalance={snapshot.creditBalance}
          walletBalance={snapshot.walletBalance}
          walletCurrency={snapshot.walletCurrency}
          hasSenderId={snapshot.hasSenderId}
          initialStep={initialStep}
        />
      </AuthCard>
    </AuthLayout>
  );
}
