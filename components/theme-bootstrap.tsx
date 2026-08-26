"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

/** Injects the theme cookie script into </head> outside the hydrating React tree. */
export function ThemeBootstrap() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        id="theme-boot"
        dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
      />
    );
  });

  return null;
}
