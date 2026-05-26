"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  saveFlutterwaveSettings,
  savePaystackSettings,
  saveStripeSettings,
  saveGatewayLastTest,
} from "@/lib/payments/gateway-settings";
import {
  testFlutterwaveConnection,
  testPaystackConnection,
  testStripeConnection,
} from "@/lib/payments/gateway-health";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

function revalidatePaymentPaths() {
  revalidatePath("/admin/payments/settings");
  revalidatePath("/admin/payments");
  revalidatePath("/dashboard/wallet");
}

export async function saveOfflinePaymentDetailsAction(formData: FormData) {
  await requireAdmin();

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const branch = String(formData.get("branch") ?? "").trim();
  const swiftCode = String(formData.get("swiftCode") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!bankName || !accountName || !accountNumber || !instructions) {
    redirect("/admin/payments/settings?error=offline");
  }

  const value: Prisma.InputJsonValue = {
    bankName,
    accountName,
    accountNumber,
    instructions,
    ...(branch ? { branch } : {}),
    ...(swiftCode ? { swiftCode } : {}),
  };

  await prisma.platformSetting.upsert({
    where: { key: "offline_payment_details" },
    update: { value },
    create: { key: "offline_payment_details", value },
  });

  revalidatePaymentPaths();
  redirect("/admin/payments/settings?saved=offline");
}

export async function savePaystackSettingsAction(formData: FormData) {
  const session = await requireAdmin();

  await savePaystackSettings(
    {
      enabled: formData.get("enabled") === "on",
      secretKey: String(formData.get("secretKey") ?? ""),
      publicKey: String(formData.get("publicKey") ?? ""),
      webhookSecret: String(formData.get("webhookSecret") ?? ""),
      defaultCurrency: String(formData.get("defaultCurrency") ?? "GHS"),
    },
    session.userId,
  );

  revalidatePaymentPaths();
  redirect("/admin/payments/settings?saved=paystack");
}

export async function saveFlutterwaveSettingsAction(formData: FormData) {
  const session = await requireAdmin();

  await saveFlutterwaveSettings(
    {
      enabled: formData.get("enabled") === "on",
      secretKey: String(formData.get("secretKey") ?? ""),
      publicKey: String(formData.get("publicKey") ?? ""),
      webhookSecret: String(formData.get("webhookSecret") ?? ""),
      defaultCurrency: String(formData.get("defaultCurrency") ?? "NGN"),
    },
    session.userId,
  );

  revalidatePaymentPaths();
  redirect("/admin/payments/settings?saved=flutterwave");
}

export async function saveStripeSettingsAction(formData: FormData) {
  const session = await requireAdmin();

  await saveStripeSettings(
    {
      enabled: formData.get("enabled") === "on",
      secretKey: String(formData.get("secretKey") ?? ""),
      publicKey: String(formData.get("publicKey") ?? ""),
      webhookSecret: String(formData.get("webhookSecret") ?? ""),
      defaultCurrency: String(formData.get("defaultCurrency") ?? "USD"),
    },
    session.userId,
  );

  revalidatePaymentPaths();
  redirect("/admin/payments/settings?saved=stripe");
}

export async function testPaystackConnectionAction() {
  await requireAdmin();
  const result = await testPaystackConnection();
  await saveGatewayLastTest("paystack_last_test", {
    ok: result.ok,
    error: result.error ?? null,
    details: result.details ?? null,
  });
  revalidatePaymentPaths();
  redirect(`/admin/payments/settings?test=paystack&result=${result.ok ? "ok" : "fail"}`);
}

export async function testFlutterwaveConnectionAction() {
  await requireAdmin();
  const result = await testFlutterwaveConnection();
  await saveGatewayLastTest("flutterwave_last_test", {
    ok: result.ok,
    error: result.error ?? null,
    details: result.details ?? null,
  });
  revalidatePaymentPaths();
  redirect(`/admin/payments/settings?test=flutterwave&result=${result.ok ? "ok" : "fail"}`);
}

export async function testStripeConnectionAction() {
  await requireAdmin();
  const result = await testStripeConnection();
  await saveGatewayLastTest("stripe_last_test", {
    ok: result.ok,
    error: result.error ?? null,
    details: result.details ?? null,
  });
  revalidatePaymentPaths();
  redirect(`/admin/payments/settings?test=stripe&result=${result.ok ? "ok" : "fail"}`);
}
