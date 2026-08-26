export const SMART_FORMS_POPUP_STORAGE_KEY = "splitsms.smart-forms-popup.dismissed";
export const SMART_FORMS_POPUP_SCROLL_RATIO = 0.25;
export const SMART_FORMS_POPUP_CTA_HREF = "/smart-forms";
export const SMART_FORMS_POPUP_IMAGE = "/images/smart-forms-hero.png";

const EXCLUDED_PREFIXES = [
  "/smart-forms",
  "/go",
  "/dashboard",
  "/admin",
  "/reseller",
  "/enterprise",
  "/developers",
  "/onboarding",
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/complete-phone",
  "/complete-profile",
  "/reset-password",
  "/f",
  "/embed",
  "/join",
  "/api",
] as const;

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.trim() || "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function shouldShowSmartFormsPopup(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return !EXCLUDED_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function hasReachedScrollThreshold({
  scrollY,
  viewportHeight,
  documentHeight,
  ratio = SMART_FORMS_POPUP_SCROLL_RATIO,
}: {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
  ratio?: number;
}): boolean {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return true;
  return scrollY / scrollable >= ratio;
}

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
};

export function isSmartFormsPopupDismissed(storage: Pick<StorageLike, "getItem">): boolean {
  return storage.getItem(SMART_FORMS_POPUP_STORAGE_KEY) === "1";
}

export function dismissSmartFormsPopup(storage: Pick<StorageLike, "setItem">): void {
  storage.setItem?.(SMART_FORMS_POPUP_STORAGE_KEY, "1");
}

export function shouldOpenSmartFormsPopup({
  pathname,
  dismissed,
  scrolled,
}: {
  pathname: string;
  dismissed: boolean;
  scrolled: boolean;
}): boolean {
  return shouldShowSmartFormsPopup(pathname) && !dismissed && scrolled;
}
