import Link from "next/link";
import { loginPasswordAction } from "@/lib/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPasswordForm({ defaultEmail }: { defaultEmail?: string }) {
  return (
    <form action={loginPasswordAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          placeholder="you@company.com"
          defaultValue={defaultEmail}
          required
          autoComplete="email"
          className="h-11 text-base"
        />
      </div>
      <PasswordField
        id="login-password"
        name="password"
        label="Password"
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
      <Button type="submit" className="w-full h-11 font-semibold text-base">
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You can also sign in with your{" "}
        <Link href="/login?phone=1" className="text-primary font-medium hover:underline">
          phone number
        </Link>{" "}
        if it is on your account.
      </p>
    </form>
  );
}
