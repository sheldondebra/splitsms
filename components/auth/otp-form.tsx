"use client";

import { useEffect, useState } from "react";
import { verifyOtpAction, resendOtpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAlert } from "@/components/auth/auth-alert";
import { Shield } from "lucide-react";

type OtpFormProps = {
  phone: string;
  purpose: string;
  countryCode?: string;
  error?: string | null;
  message?: string | null;
  resent?: boolean;
  initialCooldown?: number;
  returnTo?: string;
  /** User signed in with email tab */
  viaEmail?: boolean;
  phoneHint?: string;
  /** sms | email — where the code was delivered */
  delivery?: string;
};

const purposeLabels: Record<string, string> = {
  signup: "finish creating your account",
  login: "sign you in",
  reset: "reset your password",
};

export function OtpForm({
  phone,
  purpose,
  countryCode = "GH",
  error,
  message,
  resent,
  initialCooldown = 0,
  returnTo,
  viaEmail = false,
  phoneHint,
  delivery = "sms",
}: OtpFormProps) {
  const [cooldown, setCooldown] = useState(initialCooldown);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (initialCooldown <= 0 || initialCooldown === cooldown) return;
    queueMicrotask(() => setCooldown(initialCooldown));
  }, [initialCooldown, cooldown]);

  return (
    <div className="space-y-5">
      <AuthAlert code={resent ? "resent" : error} message={message} />

      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          {delivery === "email" ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{phoneHint ?? "your email"}</span> to{" "}
              {purposeLabels[purpose] ?? "continue"}.
            </>
          ) : viaEmail ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{phoneHint ?? phone}</span>{" "}
              (the phone on your account) to {purposeLabels[purpose] ?? "continue"}.
            </>
          ) : (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{phone}</span> to{" "}
              {purposeLabels[purpose] ?? "continue"}.
            </>
          )}{" "}
          Code expires in 10 minutes.
        </p>
      </div>

      <form action={verifyOtpAction} className="space-y-4">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="purpose" value={purpose} />
        <input type="hidden" name="countryCode" value={countryCode} />
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            required
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-[0.4em] font-mono h-12"
          />
        </div>
        <Button type="submit" className="w-full h-11 font-semibold text-base">
          {purpose === "login" ? "Verify & sign in" : "Verify & continue"}
        </Button>
      </form>

      <form action={resendOtpAction}>
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="purpose" value={purpose} />
        <input type="hidden" name="countryCode" value={countryCode} />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </Button>
      </form>
    </div>
  );
}
