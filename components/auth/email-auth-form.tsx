"use client";

import { useEffect, useState } from "react";
import { requestEmailAuthAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/auth/country-select";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { detectCountryFromLocale } from "@/lib/country-detect";
import { ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type EmailAuthFormProps = {
  countries: SignupCountryOption[];
  intent?: "login" | "signup";
};

export function EmailAuthForm({ countries, intent = "login" }: EmailAuthFormProps) {
  const isSignup = intent === "signup";
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [dialCode, setDialCode] = useState("+233");
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    if (!isSignup) return;
    const detected = detectCountryFromLocale(
      typeof navigator !== "undefined" ? navigator.language : undefined,
    );
    const match = countries.find((c) => c.code === detected);
    if (match) {
      setCountryCode(match.code);
      setDialCode(match.dialCode);
    }
  }, [countries, isSignup]);

  function onCountryChange(code: string, country: SignupCountryOption) {
    setCountryCode(code);
    setDialCode(country.dialCode);
  }

  return (
    <form action={requestEmailAuthAction} className="space-y-5">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="dialCode" value={dialCode} />
      {isSignup && <input type="hidden" name="countryCode" value={countryCode} />}

      <div className="space-y-2">
        <Label htmlFor="email-auth">Email address</Label>
        <Input
          id="email-auth"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {isSignup
            ? "We’ll email you a verification code (and verify your mobile number on file)."
            : "We’ll email a login code to this address when Mailjet is configured."}
        </p>
      </div>

      {isSignup && (
        <>
          <CountrySelect
            countries={countries}
            value={countryCode}
            onChange={onCountryChange}
          />
          <div className="space-y-2">
            <Label htmlFor="email-signup-phone">Mobile number</Label>
            <div className="flex gap-2">
              <span
                className={cn(
                  "inline-flex h-11 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm font-medium shrink-0 tabular-nums",
                )}
              >
                {dialCode}
              </span>
              <Input
                id="email-signup-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={countryCode === "GH" ? "20 000 0001" : "local number"}
                required
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value)}
                className="flex-1 h-11 text-base"
              />
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full h-11 font-semibold gap-2 text-base">
        <Mail className="h-4 w-4" />
        {isSignup ? "Send verification code" : "Send login code"}
        <ArrowRight className="h-4 w-4 opacity-80" />
      </Button>
    </form>
  );
}
