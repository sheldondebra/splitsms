"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import { createResellerClientAction } from "@/lib/actions/reseller";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CREDIT_PRESETS = [0, 50, 100, 250, 500, 1000] as const;

function generatePassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]!;
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = chars.length; i < length; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

type CreatedClient = {
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  password: string;
  creditsGranted: number;
  loginUrl: string;
};

function buildShareMessage(client: CreatedClient) {
  return [
    `Your account is ready — login details:`,
    ``,
    `Login URL: ${client.loginUrl}`,
    `Phone: ${client.phone}`,
    client.email ? `Email: ${client.email}` : null,
    `Password: ${client.password}`,
    client.creditsGranted > 0
      ? `SMS credits: ${client.creditsGranted.toLocaleString()}`
      : null,
    ``,
    `Please change your password after first login.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function AddResellerClientDialog({
  countries,
  loginBaseUrl,
  brandName,
}: {
  countries: SignupCountryOption[];
  loginBaseUrl: string;
  brandName?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"form" | "details">("form");
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("GH");
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [verifyNow, setVerifyNow] = useState(true);

  const selectedCountry = countries.find((c) => c.code === countryCode) ?? countries[0];

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries.slice(0, 40);
    return countries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.dialCode.includes(q),
      )
      .slice(0, 40);
  }, [countries, countryQuery]);

  function resetForm() {
    setStep("form");
    setCreated(null);
    setError(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setPassword(generatePassword());
    setShowPassword(false);
    setCountryCode("GH");
    setCountryQuery("");
    setCredits(100);
    setVerifyNow(true);
    setCopiedKey(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      if (step === "details") router.refresh();
      resetForm();
    }
  }

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createResellerClientAction({
        fullName,
        phone,
        email,
        password,
        countryCode,
        credits,
        verifyNow,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated({
        userId: result.userId,
        fullName: result.fullName,
        phone: result.phone,
        email: result.email,
        password: result.password,
        creditsGranted: result.creditsGranted,
        loginUrl: result.loginUrl || `${loginBaseUrl.replace(/\/$/, "")}/login`,
      });
      setStep("details");
    });
  }

  const shareMessage = created ? buildShareMessage(created) : "";
  const mailHref = created
    ? `mailto:${encodeURIComponent(created.email || "")}?subject=${encodeURIComponent(
        `${brandName?.trim() || "SplitSMS"} login details`,
      )}&body=${encodeURIComponent(shareMessage)}`
    : "#";
  const whatsappHref = created
    ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Add client
      </DialogTrigger>
      <DialogContent className="max-h-[min(90dvh,720px)] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Add a client" : "Client ready"}</DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Creates a member account under your reseller tenant with wallet and optional SMS credits."
              : "Copy or share these login details with your client now — the password is only shown once."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={selectedCountry ? `${selectedCountry.dialCode}...` : "+233..."}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="optional"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Country</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryOpen((v) => !v)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <span className="truncate">
                    {selectedCountry
                      ? `${selectedCountry.name} (${selectedCountry.dialCode})`
                      : "Select country"}
                  </span>
                  <Search className="size-3.5 text-muted-foreground" />
                </button>
                {countryOpen ? (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                    <div className="border-b border-border/60 p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={countryQuery}
                          onChange={(e) => setCountryQuery(e.target.value)}
                          placeholder="Search country…"
                          className="h-9 pl-8"
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-48 overflow-y-auto p-1">
                      {filteredCountries.map((c) => (
                        <li key={c.code}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                              c.code === countryCode && "bg-primary/10 text-primary",
                            )}
                            onClick={() => {
                              setCountryCode(c.code);
                              setCountryOpen(false);
                              setCountryQuery("");
                            }}
                          >
                            <span>
                              {c.name}{" "}
                              <span className="text-muted-foreground">({c.code})</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                          </button>
                        </li>
                      ))}
                      {filteredCountries.length === 0 ? (
                        <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No countries match
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Temporary password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                8+ characters. Generate one, then share it securely with the client.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Starter SMS credits</Label>
              <div className="flex flex-wrap gap-2">
                {CREDIT_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCredits(amount)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      credits === amount
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    {amount === 0 ? "None" : amount.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Optional starter pack funded from your reseller wallet at your sell rate.
              </p>
            </div>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={verifyNow}
                onChange={(e) => setVerifyNow(e.target.checked)}
                className="rounded border"
              />
              Mark as verified immediately
            </label>

            {error ? (
              <p className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <Button
                type="button"
                className="w-full gap-2"
                disabled={pending || !fullName.trim() || !phone.trim() || password.length < 8}
                onClick={submit}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {pending ? "Creating…" : "Create client"}
              </Button>
            </div>
          </div>
        ) : created ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">{created.fullName} created</p>
              <p className="mt-0.5 text-xs opacity-90">
                {created.creditsGranted > 0
                  ? `${created.creditsGranted.toLocaleString()} SMS credits added.`
                  : "No starter credits — fund them anytime from Wallet."}
              </p>
            </div>

            <div className="space-y-2">
              {(
                [
                  { key: "url", label: "Login URL", value: created.loginUrl },
                  { key: "phone", label: "Phone", value: created.phone },
                  ...(created.email
                    ? [{ key: "email", label: "Email", value: created.email }]
                    : []),
                  { key: "password", label: "Password", value: created.password },
                ] as const
              ).map((row) => (
                <div
                  key={row.key}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="truncate font-mono text-sm">{row.value}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 gap-1.5"
                    onClick={() => void copyValue(row.key, row.value)}
                  >
                    {copiedKey === row.key ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => void copyValue("all", shareMessage)}
              >
                {copiedKey === "all" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copy all details
              </Button>
              <a href={mailHref} className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
                <Mail className="size-3.5" />
                Email
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
              <Button type="button" variant="outline" onClick={resetForm}>
                Add another
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/reseller/users/${created.userId}`);
                  router.refresh();
                }}
              >
                Open client profile
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
