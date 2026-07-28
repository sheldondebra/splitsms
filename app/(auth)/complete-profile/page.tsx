import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { userNeedsProfileCompletion } from "@/lib/auth/phone-auth";
import { authPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = authPageMetadata(
  "/complete-profile",
  "Complete profile",
  "Finish setting up your SplitSMS account profile.",
);

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, email: true },
  });

  if (!user || !userNeedsProfileCompletion(user.fullName)) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Almost done"
      subtitle="Add your name and create a password to finish setup"
      sideDescription="Your account is verified. Set a password now so you can sign in again with email later."
    >
      <AuthCard>
        <AuthAlert code={error} />
        <CompleteProfileForm
          defaultEmail={user.email}
          emailLocked={Boolean(user.email)}
        />
      </AuthCard>
    </AuthLayout>
  );
}
