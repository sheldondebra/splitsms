"use server";

import { getSession } from "@/lib/auth/session";
import { completeOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";

export async function skipOnboardingAction() {
  const session = await getSession();
  if (!session) redirect("/login");

  await completeOnboarding(session.userId);
  redirect("/dashboard");
}

export async function finishOnboardingAction() {
  return skipOnboardingAction();
}
