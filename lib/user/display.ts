export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function getMemberDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed || trimmed === "SMS User") return "Member";
  return trimmed;
}
