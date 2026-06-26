"use client";

import { useState } from "react";
import {
  changePasswordAction,
  requestPasswordResetSmsAction,
} from "@/lib/actions/settings";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "password" | "sms";

export function ChangePasswordSection({ phone }: { phone: string }) {
  const [mode, setMode] = useState<Mode>("password");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border bg-muted/40 p-1 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "password"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <KeyRound className="h-4 w-4" />
          Know password
        </button>
        <button
          type="button"
          onClick={() => setMode("sms")}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "sms"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Reset via SMS
        </button>
      </div>

      {mode === "password" ? (
        <form action={changePasswordAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="h-11"
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
          <Button type="submit" className="h-11 w-full sm:w-auto">
            Update password
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;ll send a 6-digit code to <span className="font-medium text-foreground">{phone}</span>.
            After you verify it, you can set a new password and return here automatically.
          </p>
          <form action={requestPasswordResetSmsAction}>
            <Button type="submit" variant="outline" className="h-11 gap-2">
              <MessageSquare className="h-4 w-4" />
              Send reset code
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
