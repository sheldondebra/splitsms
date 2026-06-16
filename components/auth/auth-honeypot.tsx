import { HONEYPOT_FIELD } from "@/lib/auth/signup-guard-shared";

/** Invisible spam trap — leave empty. */
export function AuthHoneypot() {
  return (
    <input
      type="text"
      name={HONEYPOT_FIELD}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
    />
  );
}
