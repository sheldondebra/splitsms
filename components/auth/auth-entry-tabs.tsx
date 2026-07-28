"use client";

import { useState } from "react";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";

type AuthEntryTabsProps = {
  countries: SignupCountryOption[];
  intent?: "login" | "signup";
  defaultMethod?: "phone" | "email";
  defaultEmail?: string;
  /** Reseller invite id — attaches the new member to that reseller on signup. */
  resellerInvite?: string;
};

export function AuthEntryTabs({
  countries,
  intent = "login",
  defaultMethod = "phone",
  defaultEmail,
  resellerInvite,
}: AuthEntryTabsProps) {
  const [method, setMethod] = useState<"phone" | "email">(defaultMethod);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMethod("phone")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
            method === "phone"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Phone className="h-4 w-4" />
          Phone
        </button>
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
            method === "email"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
      </div>

      {method === "phone" ? (
        <PhoneAuthForm
          countries={countries}
          intent={intent}
          resellerInvite={resellerInvite}
          submitLabel={
            intent === "signup" ? "Send verification code" : "Send login code"
          }
        />
      ) : (
        <EmailAuthForm
          countries={countries}
          intent={intent}
          resellerInvite={resellerInvite}
          defaultEmail={defaultEmail}
        />
      )}
    </div>
  );
}
