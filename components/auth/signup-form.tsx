"use client";

import { useState } from "react";
import { initialCountryState } from "@/lib/auth/initial-country-state";
import { signupAction } from "@/lib/actions/auth";
import { AuthHoneypot } from "@/components/auth/auth-honeypot";
import { AuthCaptcha } from "@/components/auth/auth-captcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { CountrySelect } from "@/components/auth/country-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type SignupFormProps = {
  countries: SignupCountryOption[];
  defaultMethod?: "phone" | "email";
};

export function SignupForm({ countries, defaultMethod = "phone" }: SignupFormProps) {
  const [method, setMethod] = useState<"phone" | "email">(defaultMethod);
  const [countryCode, setCountryCode] = useState(
    () => initialCountryState(countries).countryCode,
  );
  const [dialCode, setDialCode] = useState(() => initialCountryState(countries).dialCode);
  const [phoneLocal, setPhoneLocal] = useState("");

  function onCountryChange(code: string, country: SignupCountryOption) {
    setCountryCode(code);
    setDialCode(country.dialCode);
  }

  return (
    <Tabs
      value={method}
      onValueChange={(v) => setMethod(v as "phone" | "email")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="phone" className="gap-2">
          <Phone className="h-4 w-4" />
          Phone
        </TabsTrigger>
        <TabsTrigger value="email" className="gap-2">
          <Mail className="h-4 w-4" />
          Email
        </TabsTrigger>
      </TabsList>

      <TabsContent value="phone">
        <SignupFields
          method="phone"
          countryCode={countryCode}
          dialCode={dialCode}
          countries={countries}
          onCountryChange={onCountryChange}
          phoneLocal={phoneLocal}
          onPhoneLocalChange={setPhoneLocal}
        />
      </TabsContent>

      <TabsContent value="email">
        <SignupFields
          method="email"
          countryCode={countryCode}
          dialCode={dialCode}
          countries={countries}
          onCountryChange={onCountryChange}
          phoneLocal={phoneLocal}
          onPhoneLocalChange={setPhoneLocal}
        />
      </TabsContent>
    </Tabs>
  );
}

function SignupFields({
  method,
  countryCode,
  dialCode,
  countries,
  onCountryChange,
  phoneLocal,
  onPhoneLocalChange,
}: {
  method: "phone" | "email";
  countryCode: string;
  dialCode: string;
  countries: SignupCountryOption[];
  onCountryChange: (code: string, c: SignupCountryOption) => void;
  phoneLocal: string;
  onPhoneLocalChange: (v: string) => void;
}) {
  return (
    <form action={signupAction} className="relative space-y-4">
      <AuthHoneypot />
      <input type="hidden" name="signupMethod" value={method} />
      <input type="hidden" name="dialCode" value={dialCode} />

      <div className="space-y-2">
        <Label htmlFor={`fullName-${method}`}>Full name</Label>
        <Input
          id={`fullName-${method}`}
          name="fullName"
          placeholder="Your name"
          required
          autoComplete="name"
        />
      </div>

      <CountrySelect
        countries={countries}
        value={countryCode}
        onChange={onCountryChange}
      />

      {method === "email" && (
        <div className="space-y-2">
          <Label htmlFor={`email-${method}`}>Email address</Label>
          <Input
            id={`email-${method}`}
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground">
            You&apos;ll sign in with this email.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`phone-${method}`}>
          {method === "phone" ? "Phone number" : "Phone (for SMS verification)"}
        </Label>
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-10 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm font-medium shrink-0",
            )}
          >
            {dialCode}
          </span>
          <Input
            id={`phone-${method}`}
            name="phone"
            type="tel"
            placeholder={countryCode === "GH" ? "20 000 0001" : "local number"}
            required
            autoComplete="tel"
            value={phoneLocal}
            onChange={(e) => onPhoneLocalChange(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {method === "phone"
            ? "We'll send a verification code by SMS."
            : "We'll verify your account with a one-time SMS code."}
        </p>
      </div>

      {method === "phone" && (
        <div className="space-y-2">
          <Label htmlFor={`email-opt-${method}`}>Email (optional)</Label>
          <Input
            id={`email-opt-${method}`}
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
      )}

      <PasswordField
        id={`password-${method}`}
        name="password"
        label="Password"
        showStrength
        autoComplete="new-password"
      />
      <PasswordField
        id={`confirm-${method}`}
        name="confirmPassword"
        label="Confirm password"
        showStrength={false}
        autoComplete="new-password"
      />

      <div className="space-y-2">
        <Label htmlFor={`referral-${method}`}>Referral code (optional)</Label>
        <Input id={`referral-${method}`} name="referralCode" placeholder="REF123" />
      </div>

      <AuthCaptcha />

      <Button type="submit" className="w-full font-semibold">
        {method === "phone" ? "Sign up with phone" : "Sign up with email"}
      </Button>

      <p className="text-xs text-center text-muted-foreground leading-relaxed">
        5 free SMS credits after you verify your phone number.
      </p>
    </form>
  );
}
