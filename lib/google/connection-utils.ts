export function hasScopes(granted: string[], required: string[]): boolean {
  const set = new Set(granted);
  return required.every((s) => set.has(s));
}

export function missingScopes(granted: string[], required: string[]): string[] {
  const set = new Set(granted);
  return required.filter((s) => !set.has(s));
}

export function mergeScopes(...lists: string[][]): string[] {
  return [...new Set(lists.flat().filter(Boolean))].sort();
}

export function parseScopeString(scope: string | undefined | null): string[] {
  if (!scope?.trim()) return [];
  return scope
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
