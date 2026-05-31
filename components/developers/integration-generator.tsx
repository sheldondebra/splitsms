"use client";

import { useMemo, useState } from "react";
import { FileCode2, Wand2 } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { cn } from "@/lib/utils";
import {
  buildEnvSnippet,
  buildIntegrationCode,
  buildSdkInstallCommand,
  integrationStacks,
  type IntegrationStack,
} from "@/lib/developers/integration-snippets";

type IntegrationGeneratorProps = {
  baseUrl: string;
  apiV1: string;
};

export function IntegrationGenerator({ baseUrl, apiV1 }: IntegrationGeneratorProps) {
  const [stack, setStack] = useState<IntegrationStack>("nextjs-sms");

  const envSnippet = useMemo(() => buildEnvSnippet(baseUrl), [baseUrl]);
  const { filename, code } = useMemo(
    () => buildIntegrationCode(stack, baseUrl, apiV1),
    [stack, baseUrl, apiV1],
  );
  const sdkInstall = buildSdkInstallCommand(baseUrl);

  return (
    <div className="space-y-6">
      <AppCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <AppCardBody className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Wand2 className="h-5 w-5" />
            <p className="font-semibold">Vibe coder mode</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pick a stack, copy <code className="text-xs bg-muted px-1 rounded">.env</code> and code
            into Cursor, Bolt, or Replit. Use a{" "}
            <strong className="text-foreground">sandbox key</strong> (sk_test_) first — no live SMS
            charges.
          </p>
        </AppCardBody>
      </AppCard>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Stack
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {integrationStacks.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStack(s.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                stack === s.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                  : "border-border/60 hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <CodePanel title=".env.local" subtitle="Environment variables" code={envSnippet} />

      {stack === "node-sdk" && (
        <CodePanel title="Install SDK" subtitle="Not on npm registry" code={sdkInstall} />
      )}

      <CodePanel
        title={filename ?? "Code"}
        subtitle="Paste into your project"
        code={code}
        icon={FileCode2}
      />

      <p className="text-xs text-muted-foreground">
        OpenAPI:{" "}
        <a href="/openapi.json" className="text-primary hover:underline font-mono">
          /openapi.json
        </a>{" "}
        · AI docs:{" "}
        <a href="/llms.txt" className="text-primary hover:underline font-mono">
          /llms.txt
        </a>{" "}
        ·{" "}
        <a href="/developers/prompts" className="text-primary hover:underline">
          Prompt library
        </a>
      </p>
    </div>
  );
}

function CodePanel({
  title,
  subtitle,
  code,
  icon: Icon = FileCode2,
}: {
  title: string;
  subtitle: string;
  code: string;
  icon?: typeof FileCode2;
}) {
  return (
    <AppCard>
      <AppCardBody className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold truncate">{title}</p>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <CopyButton value={code} label="Copy all" />
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground/90 max-h-[420px] overflow-y-auto">
          {code}
        </pre>
      </AppCardBody>
    </AppCard>
  );
}
