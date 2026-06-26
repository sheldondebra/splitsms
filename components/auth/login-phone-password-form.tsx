import Link from "next/link";
import { loginPasswordAction } from "@/lib/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPhonePasswordForm() {
  return (
    <form action={loginPasswordAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-identifier">Phone number</Label>
        <Input
          id="login-identifier"
          name="identifier"
          type="tel"
          inputMode="tel"
          placeholder="+233 20 000 0001"
          required
          autoComplete="tel"
          className="h-11 text-base"
        />
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
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline">
          ← Sign in with email instead
        </Link>
      </p>
    </form>
  );
}
