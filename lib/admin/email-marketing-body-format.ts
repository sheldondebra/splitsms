/** Shared between the compose UI (client) and the render pipeline (server). */

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

function escapeForHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * System templates and anything saved before the rich text editor shipped are
 * plain text with blank-line paragraph breaks. Wrap them in <p> tags so the
 * editor shows the same breaks instead of collapsing them into one line.
 */
export function plainTextToEditorHtml(value: string): string {
  if (!value.trim()) return "";
  if (looksLikeHtml(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeForHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
