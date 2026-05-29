import { redirect } from "next/navigation";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { userNeedsProfileCompletion } from "@/lib/auth/phone-auth";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  if (!user || !userNeedsProfileCompletion(user.fullName)) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Almost done"
      subtitle="Tell us your name to finish setting up"
      sideDescription="Your phone is verified. One quick step and you can send your first SMS."
    >
      <AuthCard>
        <AuthAlert code={error} />
        <CompleteProfileForm />
      </AuthCard>
    </AuthLayout>
  );
}
