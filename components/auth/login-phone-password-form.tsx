import Link from "next/link";
import { Phone } from "lucide-react";
import { loginPasswordAction } from "@/lib/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPhonePasswordForm({ returnTo }: { returnTo?: string }) {
  return (
    <form action={loginPasswordAction} className="space-y-4">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="space-y-2">
        <Label htmlFor="login-identifier">Phone number</Label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="login-identifier"
            name="identifier"
            type="tel"
            inputMode="tel"
            placeholder="+233 20 000 0001"
            required
            autoComplete="tel"
            className="h-11 pl-10 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">International format with country code</p>
      </div>
      <PasswordField
        id="login-password-phone"
        name="password"
        label="Password"
        placeholder="Enter your password"
        showStrength={false}
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-primary font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <AuthSubmitButton label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}