"use client";

import { useState } from "react";
import {
  changePasswordAction,
  requestPasswordResetSmsAction,
  requestPasswordResetEmailAction,
} from "@/lib/actions/settings";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "password" | "sms" | "email";

const MODES: { id: Mode; label: string; short: string; icon: typeof KeyRound }[] = [
  { id: "password", label: "Know password", short: "Password", icon: KeyRound },
  { id: "sms", label: "Reset via SMS", short: "SMS", icon: MessageSquare },
  { id: "email", label: "Reset via Email", short: "Email", icon: Mail },
];

export function ChangePasswordSection({
  phone,
  email,
}: {
  phone: string;
  email: string | null;
}) {
  const [mode, setMode] = useState<Mode>("password");
  const hasEmail = Boolean(email?.trim());

  return (
    <div className="max-w-lg space-y-4">
      <div
        role="tablist"
        aria-label="Password options"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/30 p-1"
      >
        {MODES.map(({ id, label, short, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors sm:gap-2 sm:px-3",
              mode === id
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <div className="rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5">
          <form action={changePasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl"
              />
            </div>
            <PasswordField
              id="newPassword"
              name="password"
              label="New password"
              showStrength
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmNewPassword"
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
            />
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold sm:w-auto sm:px-8">
              Update password
            </Button>
          </form>
        </div>
      ) : mode === "sms" ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/15">
          <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">SMS verification</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                6-digit code to your registered phone
              </p>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              We&apos;ll send a 6-digit code to{" "}
              <span className="font-medium text-foreground">{phone}</span>. After you
              verify it, you can set a new password and return here automatically.
            </p>
            <form action={requestPasswordResetSmsAction}>
              <Button type="submit" className="h-11 w-full gap-2 rounded-xl font-semibold sm:w-auto sm:px-6">
                <MessageSquare className="h-4 w-4" />
                Send reset code
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/15">
          <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Email reset link</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Secure link · expires in 1 hour
              </p>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            {hasEmail ? (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We&apos;ll email a secure reset link to{" "}
                  <span className="break-all font-medium text-foreground">{email}</span>.
                </p>
                <form action={requestPasswordResetEmailAction}>
                  <Button
                    type="submit"
                    className="h-11 w-full gap-2 rounded-xl font-semibold sm:w-auto sm:px-6"
                  >
                    <Mail className="h-4 w-4" />
                    Send reset link
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add an email under the{" "}
                <span className="font-medium text-foreground">Profile</span> tab first,
                then you can reset your password by email.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
