"use client";

import { completeProfileAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { Gift } from "lucide-react";

export function CompleteProfileForm({
  defaultEmail,
  emailLocked = false,
}: {
  defaultEmail?: string | null;
  emailLocked?: boolean;
}) {
  return (
    <form action={completeProfileAction} className="space-y-5">
      <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex gap-2">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <p>
          Phone verified! Add your name and create a password so you can sign in again later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="e.g. Ama Mensah"
          required
          autoComplete="name"
          autoFocus
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email {emailLocked ? "" : "(optional)"}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          defaultValue={defaultEmail ?? undefined}
          readOnly={emailLocked}
          autoComplete="email"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          {emailLocked
            ? "Used for login codes, receipts, and account recovery."
            : "For receipts and account recovery. You can add this later in settings."}
        </p>
      </div>

      <PasswordField
        id="profile-password"
        name="password"
        label="Create password"
        placeholder="Create a strong password"
        showStrength
        autoComplete="new-password"
      />
      <PasswordField
        id="profile-confirm-password"
        name="confirmPassword"
        label="Confirm password"
        placeholder="Repeat your password"
        showStrength={false}
        autoComplete="new-password"
      />

      <Button type="submit" className="w-full h-11 font-semibold">
        Save and continue
      </Button>
    </form>
  );
}
