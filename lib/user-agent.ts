export function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return { label: "Unknown device", mobile: false, os: "—", browser: "—" };
  const mobile = /iPhone|iPad|Android|Mobile/i.test(userAgent);
  let browser = "Other";
  if (/Edg\//i.test(userAgent)) browser = "Edge";
  else if (/Chrome/i.test(userAgent)) browser = "Chrome";
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";

  let os = "Unknown";
  if (/Windows NT/i.test(userAgent)) os = "Windows";
  else if (/Mac OS X/i.test(userAgent)) os = macOSLabel(userAgent);
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad/i.test(userAgent)) os = "iOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  let label = `${browser} · ${os}`;
  if (mobile) label += " (mobile)";

  return { label, mobile, os, browser };
}

function macOSLabel(ua: string) {
  if (/iPhone/i.test(ua)) return "iOS";
  if (/iPad/i.test(ua)) return "iPadOS";
  return "macOS";
}
