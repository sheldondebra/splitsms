export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export function parseDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|playbook/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/android/.test(ua)) return "tablet";
  return "desktop";
}

export function deviceLabel(type: DeviceType): string {
  switch (type) {
    case "mobile":
      return "Mobile";
    case "desktop":
      return "Desktop";
    case "tablet":
      return "Tablet";
    default:
      return "Unknown";
  }
}
