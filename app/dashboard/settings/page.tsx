import Link from "next/link";
import { format } from "date-fns";
import {
  saveWebhookAction,
  clearWebhookAction,
  updateProfileAction,
} from "@/lib/actions/settings";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { SettingsAlerts } from "@/components/settings/settings-alerts";
import { ChangePasswordSection } from "@/components/settings/change-password-section";
import {
  User,
  Shield,
  Palette,
  Bell,
  LogOut,
  Code2,
  BadgeCheck,
  LifeBuoy,
  Smartphone,
} from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    profile?: string;
    password?: string;
    webhook?: string;
    error?: string;
    cooldown?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  const [user, webhook, sessionCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        phone: true,
        email: true,
        countryCode: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.webhookEndpoint.findFirst({
      where: { userId: session.userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSession.count({ where: { userId: session.userId } }),
  ]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile, security, appearance, and notifications
        </p>
      </div>

      <SettingsAlerts
        profile={params.profile}
        password={params.password}
        webhook={params.webhook}
        error={params.error}
        cooldown={params.cooldown}
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your account details visible across SplitSMS</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user.fullName}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email ?? ""}
                placeholder="you@company.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="flex items-center gap-2 h-11 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4 shrink-0" />
                {user.phone}
                {user.isVerified && (
                  <span className="ml-auto text-xs font-medium text-emerald-600">Verified</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Country: {user.countryCode}. Contact support to change your phone number.
              </p>
            </div>
            <Button type="submit" className="h-11">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Password & security
          </CardTitle>
          <CardDescription>
            Change your password or reset it with an SMS code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordSection phone={user.phone} />
          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground">
            Active sessions on this account: {sessionCount}. Signing out ends your current session.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Light, dark, or match your device settings</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Delivery notifications
          </CardTitle>
          <CardDescription>
            Optional webhook when messages are sent, delivered, or fail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={saveWebhookAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                name="url"
                type="url"
                defaultValue={webhook?.url ?? ""}
                placeholder="https://your-site.com/api/splitsms-webhook"
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11">
              Save webhook
            </Button>
          </form>
          {webhook?.url && (
            <form action={clearWebhookAction}>
              <Button type="submit" variant="outline" className="h-11">
                Remove webhook
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            Prefer the full setup?{" "}
            <Link href="/developers/webhooks" className="text-primary font-medium hover:underline">
              Developers → Webhooks
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[
            { href: "/developers", icon: Code2, label: "Developers" },
            { href: "/dashboard/sender-ids", icon: BadgeCheck, label: "Sender IDs" },
            { href: "/dashboard/support", icon: LifeBuoy, label: "Help" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Member since {format(user.createdAt, "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="h-11 gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
