import { GOOGLE_SCOPES } from "@/lib/google/scopes";

/** Scopes that imply a narrower required scope. */
const SCOPE_IMPLIES: Record<string, string[]> = {
  [GOOGLE_SCOPES.contactsReadonly]: [GOOGLE_SCOPES.contacts],
};

function scopeSatisfied(granted: Set<string>, required: string): boolean {
  if (granted.has(required)) return true;
  const alternatives = SCOPE_IMPLIES[required];
  return Boolean(alternatives?.some((alt) => granted.has(alt)));
}

export function hasScopes(granted: string[], required: string[]): boolean {
  const set = new Set(granted);
  return required.every((s) => scopeSatisfied(set, s));
}

export function missingScopes(granted: string[], required: string[]): string[] {
  const set = new Set(granted);
  return required.filter((s) => !scopeSatisfied(set, s));
}

export function mergeScopes(...lists: string[][]): string[] {
  return [...new Set(lists.flat().filter(Boolean))].sort();
}

export function parseScopeString(scope: string | undefined | null): string[] {
  if (!scope?.trim()) return [];
  return scope
    .replace(/\+/g, " ")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Prefer scopes returned by Google's token response. Never invent scopes from
 * what we requested when Google reports a narrower grant.
 *
 * If the token omits `scope`, merge previously stored grants with the ones we
 * just requested (incremental auth sometimes omits the field).
 */
export function resolveGrantedScopes(
  tokenScope: string | undefined | null,
  requestedFallback: string[],
  previouslyGranted: string[] = [],
): string[] {
  const fromToken = parseScopeString(tokenScope);
  if (fromToken.length > 0) return fromToken;
  return mergeScopes(previouslyGranted, requestedFallback);
}
