"use client";

import { useEffect, useState } from "react";
import { requestPhoneAuthAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/auth/country-select";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { detectCountryFromLocale } from "@/lib/country-detect";
import { ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type PhoneAuthFormProps = {
  countries: SignupCountryOption[];
  intent?: "login" | "signup";
  submitLabel?: string;
};

export function PhoneAuthForm({
  countries,
  intent = "login",
  submitLabel,
}: PhoneAuthFormProps) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [dialCode, setDialCode] = useState("+233");
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    const detected = detectCountryFromLocale(
      typeof navigator !== "undefined" ? navigator.language : undefined,
    );
    const match = countries.find((c) => c.code === detected);
    if (match) {
      setCountryCode(match.code);
      setDialCode(match.dialCode);
    }
  }, [countries]);

  function onCountryChange(code: string, country: SignupCountryOption) {
    setCountryCode(code);
    setDialCode(country.dialCode);
  }

  const label =
    submitLabel ??
    (intent === "signup" ? "Continue — send code" : "Continue with phone");

  return (
    <form action={requestPhoneAuthAction} className="space-y-5">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="dialCode" value={dialCode} />

      <CountrySelect
        countries={countries}
        value={countryCode}
        onChange={onCountryChange}
      />

      <div className="space-y-2">
        <Label htmlFor="phone-auth">Mobile number</Label>
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-11 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm font-medium shrink-0 tabular-nums",
            )}
          >
            {dialCode}
          </span>
          <Input
            id="phone-auth"
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
        <p className="text-xs text-muted-foreground">
          We&apos;ll text you a 6-digit code. No password needed.
        </p>
      </div>

      <Button type="submit" className="w-full h-11 font-semibold gap-2 text-base">
        <Phone className="h-4 w-4" />
        {label}
        <ArrowRight className="h-4 w-4 opacity-80" />
      </Button>
    </form>
  );
}
