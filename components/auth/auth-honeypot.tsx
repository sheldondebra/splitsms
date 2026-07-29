"use client";

import { HONEYPOT_FIELD } from "@/lib/auth/signup-guard-shared";

/**
 * Invisible spam trap — leave empty.
 * Uses an obscure name + autofill blockers so password managers don't fill it
 * (which previously surfaced as error=blocked on signup).
 */
export function AuthHoneypot() {
  return (
    <div
      aria-hidden
      className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor={HONEYPOT_FIELD}>Leave blank</label>
      <input
        id={HONEYPOT_FIELD}
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        defaultValue=""
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        data-form-type="other"
      />
    </div>
  );
}
