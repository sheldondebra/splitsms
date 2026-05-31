import { AlertTriangle, Info } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";

type SdkNpmInstallNoticeProps = {
  installUrl: string;
  /** Stable API route — works after deploy even if /public/sdk/ CDN path lags */
  apiInstallUrl?: string;
  className?: string;
};

/**
 * @splitsms/sdk is NOT on registry.npmjs.org — installs must use the SplitSMS-hosted .tgz URL.
 */
export function SdkNpmInstallNotice({
  installUrl,
  apiInstallUrl,
  className,
}: SdkNpmInstallNoticeProps) {
  const productionCmd = `npm install ${installUrl}`;
  const apiCmd = apiInstallUrl ? `npm install ${apiInstallUrl}` : null;
  const localDevCmd = "npm install http://localhost:3000/sdk/javascript/splitsms-sdk.tgz";
  const localApiCmd = "npm install http://localhost:3000/api/sdk/javascript/tgz";

  return (
    <div className={className ?? "space-y-4 max-w-3xl"}>
      <div className="rounded-xl border-2 border-red-500/40 bg-red-500/8 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
        <div className="flex gap-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5"
            aria-hidden
          />
          <div className="min-w-0 space-y-2">
            <p className="font-semibold text-foreground text-sm sm:text-base">
              Do not run{" "}
              <code className="text-xs sm:text-sm bg-red-500/10 px-1.5 py-0.5 rounded font-mono">
                npm install @splitsms/sdk
              </code>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              That name is not on registry.npmjs.org (404). Install from a SplitSMS{" "}
              <code className="text-xs bg-muted px-1 rounded">.tgz</code> URL instead — npm still
              installs it as{" "}
              <code className="text-xs bg-muted px-1 rounded">@splitsms/sdk</code> in{" "}
              <code className="text-xs bg-muted px-1 rounded">node_modules</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
        <div className="flex gap-3">
          <Info className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-foreground text-sm sm:text-base">Install now (local)</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Run from your app folder (must have a{" "}
              <code className="text-xs bg-muted px-1 rounded">package.json</code>). With{" "}
              <code className="text-xs bg-muted px-1 rounded">npm run dev</code> running in this
              repo:
            </p>
          </div>
        </div>
        <InstallCommandBlock label="Dev server" command={localDevCmd} />
        <InstallCommandBlock label="Dev API fallback" command={localApiCmd} />
        <p className="text-xs text-muted-foreground">
          Or use a file path after{" "}
          <code className="bg-muted px-1 rounded font-mono">npm run sync:sdks</code>:{" "}
          <code className="bg-muted px-1 rounded font-mono break-all">
            npm install ./path/to/splitsms/public/sdk/javascript/splitsms-sdk.tgz
          </code>
        </p>
      </div>

      <div className="rounded-lg bg-zinc-950 border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Production (after deploy)
          </span>
          <CopyButton value={productionCmd} label="Copy" size="sm" />
        </div>
        <pre className="px-3 py-3 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap break-all">
          {productionCmd}
        </pre>
        {apiCmd ? (
          <>
            <div className="border-t border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              API fallback (same tarball)
            </div>
            <pre className="px-3 pb-3 text-xs sm:text-sm font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
              {apiCmd}
            </pre>
          </>
        ) : null}
        <p className="border-t border-white/10 px-3 py-2 text-xs text-amber-200/80">
          If splitsms.com returns 404, the latest build is not live yet — use the local commands
          above, then redeploy this app (<code className="font-mono">npm run build</code> runs{" "}
          <code className="font-mono">sync:sdks</code> automatically).
        </p>
      </div>
    </div>
  );
}

function InstallCommandBlock({ label, command }: { label: string; command: string }) {
  return (
    <div className="rounded-lg bg-zinc-950 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90">
          {label}
        </span>
        <CopyButton value={command} label="Copy" size="sm" />
      </div>
      <pre className="px-3 py-3 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap break-all">
        {command}
      </pre>
    </div>
  );
}
