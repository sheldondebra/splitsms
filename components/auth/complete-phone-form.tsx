"use client";

import { useState } from "react";
import { completeGooglePhoneAction } from "@/lib/actions/auth";
import { initialCountryState } from "@/lib/auth/initial-country-state";
import { AuthHoneypot } from "@/components/auth/auth-honeypot";
import { AuthCaptcha } from "@/components/auth/auth-captcha";
import { CountrySelect } from "@/components/auth/country-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompletePhoneForm({
  countries,
  email,
}: {
  countries: SignupCountryOption[];
  email?: string | null;
}) {
  const initial = initialCountryState(countries);
  const [countryCode, setCountryCode] = useState(initial.countryCode);
  const [dialCode, setDialCode] = useState(initial.dialCode);
  const [phoneLocal, setPhoneLocal] = useState("");

  function onCountryChange(code: string, country: SignupCountryOption) {
    setCountryCode(code);
    setDialCode(country.dialCode);
  }

  return (
    <form action={completeGooglePhoneAction} className="relative space-y-5">
      <AuthHoneypot />
      <input type="hidden" name="dialCode" value={dialCode} />

      {email ? (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{email}</span>
        </div>
      ) : null}

      <CountrySelect
        countries={countries}
        value={countryCode}
        onChange={onCountryChange}
      />

      <div className="space-y-2">
        <Label htmlFor="google-phone">Mobile number</Label>
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-11 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm font-medium shrink-0 tabular-nums",
            )}
          >
            {dialCode}
          </span>
          <Input
            id="google-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={countryCode === "GH" ? "20 000 0001" : "local number"}
            required
            value={phoneLocal}
            onChange={(e) => setPhoneLocal(e.target.value)}
            className="flex-1 h-11 text-base"
            autoFocus
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We’ll text a 6-digit code to verify this number before you can send SMS.
        </p>
      </div>

      <AuthCaptcha />

      <Button type="submit" className="w-full h-11 font-semibold gap-2 text-base">
        <Phone className="h-4 w-4" />
        Continue — send code
        <ArrowRight className="h-4 w-4 opacity-80" />
      </Button>
    </form>
  );
}
