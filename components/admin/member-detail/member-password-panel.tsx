"use client";

import { useState } from "react";
import {
  adminResetPasswordAction,
  adminSendPasswordResetEmailLinkAction,
  adminSendPasswordResetLinkAction,
} from "@/lib/actions/admin-members";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MessageSquare,
  RefreshCw,
  Shield,
  ShieldAlert,
} from "lucide-react";

type Props = {
  userId: string;
  memberName: string;
  phone: string;
  email: string | null;
  memberId: string;
};

function generateTempPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const pools = [upper, lower, digits, symbols];
  const all = pools.join("");
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = pools.map((pool, i) => pool[bytes[i]! % pool.length]!);
  for (let i = pools.length; i < length; i++) {
    chars.push(all[bytes[i]! % all.length]!);
  }
  const shuffle = new Uint32Array(length);
  crypto.getRandomValues(shuffle);
  for (let i = length - 1; i > 0; i--) {
    const j = shuffle[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export function MemberPasswordPanel({
  userId,
  memberName,
  phone,
  email,
  memberId,
}: Props) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmSetOpen, setConfirmSetOpen] = useState(false);
  const [confirmOtpOpen, setConfirmOtpOpen] = useState(false);
  const [confirmLinkOpen, setConfirmLinkOpen] = useState(false);

  const canSet = password.trim().length >= 8;
  const canSendLink = Boolean(email?.trim());

  return (
    <>
      <AdminCard
        title="Password & reset"
        description="Set a password, email a reset link, or send an SMS OTP"
      >
        <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10">
          <div className="flex items-start gap-2.5 border-b border-border/40 px-3.5 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Set password</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Replaces their current password immediately. You’ll see the temporary value once
                  to share securely.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member-new-password" className="text-xs">
                  New password
                </Label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Input
                      id="member-new-password"
                      type={visible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setVisible((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label={visible ? "Hide password" : "Show password"}
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5"
                    onClick={() => {
                      setPassword(generateTempPassword());
                      setVisible(true);
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full gap-1.5"
                disabled={!canSet}
                onClick={() => setConfirmSetOpen(true)}
              >
                <Shield className="h-4 w-4" />
                Set password…
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-b border-border/40 px-3.5 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/12 text-sky-700 dark:text-sky-300">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Send reset link (email)</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Emails username, member ID, email, login URL, and a reset CTA. Also texts a short
                  SMS that a link was sent — no Slack alert when they finish resetting.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2 min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold">
                    {email?.trim() || "No email on file"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2 min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Member ID
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold tracking-wider">{memberId}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                disabled={!canSendLink}
                onClick={() => setConfirmLinkOpen(true)}
              >
                <Mail className="h-4 w-4" />
                {canSendLink ? "Send reset link…" : "Add an email first"}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 px-3.5 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/12 text-amber-800 dark:text-amber-200">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Send reset OTP (SMS)</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Texts a one-time code so they can reset without email.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Destination
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{phone}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => setConfirmOtpOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                Send reset OTP…
              </Button>
            </div>
          </div>
        </div>
      </AdminCard>

      <Dialog open={confirmSetOpen} onOpenChange={setConfirmSetOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="px-5 pt-5 pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/12 text-amber-800 dark:text-amber-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle>Set a new password?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                This replaces the current password for{" "}
                <span className="font-medium text-foreground">{memberName}</span> right away.
                Share the new password only through a secure channel.
              </DialogDescription>
            </DialogHeader>
            <div
              className={cn(
                "mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5",
                "font-mono text-sm tracking-wide",
              )}
            >
              {visible ? password : "•".repeat(Math.min(password.length, 16))}
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmSetOpen(false)}>
              Cancel
            </Button>
            <form action={adminResetPasswordAction}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="password" value={password} />
              <Button type="submit" className="w-full gap-1.5 sm:w-auto">
                <Shield className="h-4 w-4" />
                Confirm & set password
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLinkOpen} onOpenChange={setConfirmLinkOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="px-5 pt-5 pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300">
              <Mail className="h-5 w-5" />
            </div>
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle>Send password reset link?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                Emails a 1-hour reset link to{" "}
                <span className="font-medium text-foreground">{email}</span> with username, member
                ID, and login URL. Also texts{" "}
                <span className="font-mono font-medium text-foreground">{phone}</span> that a link
                was sent. Completing the reset will not notify Slack.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmLinkOpen(false)}>
              Cancel
            </Button>
            <form action={adminSendPasswordResetEmailLinkAction}>
              <input type="hidden" name="userId" value={userId} />
              <Button type="submit" className="w-full gap-1.5 sm:w-auto">
                <Mail className="h-4 w-4" />
                Confirm & send link
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOtpOpen} onOpenChange={setConfirmOtpOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="px-5 pt-5 pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/12 text-amber-800 dark:text-amber-200">
              <MessageSquare className="h-5 w-5" />
            </div>
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle>Send password reset OTP?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                An SMS with a one-time code will be sent to{" "}
                <span className="font-mono font-medium text-foreground">{phone}</span> for{" "}
                <span className="font-medium text-foreground">{memberName}</span>.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmOtpOpen(false)}>
              Cancel
            </Button>
            <form action={adminSendPasswordResetLinkAction}>
              <input type="hidden" name="userId" value={userId} />
              <Button type="submit" className="w-full gap-1.5 sm:w-auto">
                <MessageSquare className="h-4 w-4" />
                Confirm & send OTP
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
