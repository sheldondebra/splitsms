"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiDocSections, API_BASE_HINT } from "@/lib/developers/api-reference";
import { EndpointCard } from "@/components/developers/endpoint-card";
import { CopyButton } from "@/components/developers/copy-button";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  KeyRound,
  Link2,
  Megaphone,
  Puzzle,
  Send,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  auth: Shield,
  wallet: Wallet,
  sms: Send,
  contacts: Users,
  campaigns: Megaphone,
  otp: KeyRound,
  connect: Link2,
  "sender-ids": BadgeCheck,
  wordpress: Puzzle,
};

export function ApiDocsView({ baseUrl }: { baseUrl?: string }) {
  const authHeader = `Authorization: Bearer YOUR_API_KEY`;
  const sections = apiDocSections.filter((s) => s.id !== "auth");

  return (
    <div className="space-y-8">
      <CardAuthBlock authHeader={authHeader} baseUrl={baseUrl ?? API_BASE_HINT} />

      <Tabs defaultValue="sms" className="w-full gap-0">
        <div className="sticky top-16 z-10 -mx-1 bg-background/90 px-1 py-2 backdrop-blur-md">
          <TabsList
            className={cn(
              "!h-auto grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-border/60",
              "bg-muted/50 p-2 shadow-sm sm:grid-cols-4 lg:grid-cols-8",
            )}
          >
            {sections.map((s) => {
              const Icon = sectionIcons[s.id] ?? Send;
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className={cn(
                    "group/tab !h-auto min-h-11 w-full flex-none flex-col gap-1 rounded-xl px-2 py-2.5",
                    "text-[11px] font-semibold leading-tight sm:text-xs",
                    "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                    "data-active:bg-primary data-active:text-primary-foreground data-active:shadow-md data-active:shadow-primary/25",
                    "dark:data-active:bg-primary dark:data-active:text-primary-foreground",
                  )}
                >
                  <Icon className="size-4 opacity-80 group-data-active/tab:opacity-100" />
                  <span>{s.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {sections.map((section) => {
          const Icon = sectionIcons[section.id] ?? Send;
          return (
            <TabsContent key={section.id} value={section.id} className="mt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <div className="space-y-3">
                {section.endpoints.map((ep) => (
                  <EndpointCard
                    key={`${ep.method}-${ep.path}`}
                    endpoint={ep}
                    baseUrl={baseUrl ?? API_BASE_HINT}
                  />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <ErrorsBlock />
    </div>
  );
}

function CardAuthBlock({
  authHeader,
  baseUrl,
}: {
  authHeader: string;
  baseUrl: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-card p-5 sm:p-6 space-y-4 shadow-sm">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Authentication
      </h2>
      <p className="text-sm text-muted-foreground">
        Send your API key in the <code className="text-xs bg-muted px-1 rounded">Authorization</code> header on every request. Use{" "}
        <code className="text-xs bg-muted px-1 rounded">sk_test_</code> keys for sandbox (no real SMS charges).
      </p>
      <div className="rounded-xl bg-zinc-950 text-zinc-100 p-4 font-mono text-xs space-y-2">
        <p>
          <span className="text-zinc-500">Base URL</span>
          <br />
          <span className="text-emerald-400">{baseUrl}</span>
        </p>
        <p>
          <span className="text-zinc-500">Header</span>
          <br />
          {authHeader}
        </p>
      </div>
      <CopyButton
        value={`${authHeader}\n# Base: ${baseUrl}`}
        label="Copy auth template"
      />
    </div>
  );
}

function ErrorsBlock() {
  const errors = [
    { code: "UNAUTHORIZED", status: 401, desc: "Missing or invalid API key" },
    { code: "FORBIDDEN", status: 403, desc: "Key lacks required permission" },
    { code: "INVALID_REQUEST", status: 400, desc: "Bad JSON or validation failed" },
    { code: "NOT_FOUND", status: 404, desc: "Resource does not exist" },
    { code: "RATE_LIMITED", status: 429, desc: "Too many requests — slow down" },
    { code: "INSUFFICIENT_CREDITS", status: 402, desc: "Not enough SMS credits" },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-3 shadow-sm">
      <h2 className="text-lg font-semibold">Error responses</h2>
      <p className="text-sm text-muted-foreground">
        All errors return <code className="text-xs bg-muted px-1 rounded">{`{ "success": false, "error": { "code", "message" } }`}</code>
      </p>
      <ul className="divide-y text-sm">
        {errors.map((e) => (
          <li key={e.code} className="flex gap-4 py-2.5">
            <code className="font-mono text-xs shrink-0 w-36">{e.code}</code>
            <span className="text-muted-foreground w-12 shrink-0">{e.status}</span>
            <span>{e.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
