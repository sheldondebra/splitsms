import Link from "next/link";
import { loginPasswordAction, loginOtpRequestAction } from "@/lib/actions/auth";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; rate_limit?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your SplitSMS account"
      sideDescription="Send campaigns to thousands. Track delivery. Pay with MoMo, Paystack, and more."
    >
      <AuthCard>
        <AuthAlert code={reset === "success" ? "reset" : error} />

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">SMS code</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form action={loginPasswordAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier-password">Email / phone number</Label>
                <Input
                  id="identifier-password"
                  name="identifier"
                  type="text"
                  inputMode="email"
                  placeholder="you@email.com or +233 20 000 0001"
                  required
                  autoComplete="username"
                />
              </div>
              <PasswordField
                id="password"
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
              <Button type="submit" className="w-full font-semibold">
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            <form action={loginOtpRequestAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier-otp">Email / phone number</Label>
                <Input
                  id="identifier-otp"
                  name="identifier"
                  type="text"
                  inputMode="email"
                  placeholder="you@email.com or +233 20 000 0001"
                  required
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a one-time code to the phone number on your account. No password
                needed.
              </p>
              <Button type="submit" className="w-full font-semibold">
                Send verification code
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create one free
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
