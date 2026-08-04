import { GOOGLE_BASE_SCOPES } from "@/lib/google/scopes";
import { mergeScopes } from "@/lib/google/connection-utils";

/** Build the Integrations connect URL for incremental scope grants. */
export function googleConnectHref(opts: {
  scopes: string[];
  returnTo: string;
  force?: boolean;
}) {
  const params = new URLSearchParams();
  params.set("returnTo", opts.returnTo);
  const scopes = mergeScopes([...GOOGLE_BASE_SCOPES], opts.scopes);
  if (scopes.length) params.set("scopes", scopes.join(" "));
  if (opts.force) params.set("force", "1");
  return `/api/integrations/google/connect?${params.toString()}`;
}
