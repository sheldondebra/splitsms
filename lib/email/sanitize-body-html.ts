import sanitizeHtml from "sanitize-html";

/** Matches the grayscale email theme in lib/email/layout.ts. */
const bodyColor = "#444444";
const inkColor = "#111111";

/** Base look injected on every tag, regardless of what the editor produced. */
const BASE_STYLE: Record<string, string> = {
  p: `margin:0 0 14px;font-size:15px;line-height:1.65;color:${bodyColor};`,
  h2: `margin:20px 0 10px;font-size:18px;line-height:1.35;font-weight:700;color:${inkColor};`,
  h3: `margin:16px 0 8px;font-size:16px;line-height:1.4;font-weight:700;color:${inkColor};`,
  blockquote: `margin:0 0 14px;padding:2px 0 2px 14px;border-left:3px solid #dddddd;color:#555555;font-size:14px;line-height:1.6;`,
  ul: `margin:0 0 14px;padding:0 0 0 20px;font-size:15px;line-height:1.6;color:${bodyColor};`,
  ol: `margin:0 0 14px;padding:0 0 0 20px;font-size:15px;line-height:1.6;color:${bodyColor};`,
  li: `margin:0 0 6px;`,
  a: `color:${inkColor};text-decoration:underline;`,
  strong: `font-weight:700;color:${inkColor};`,
  b: `font-weight:700;color:${inkColor};`,
  img: `display:block;max-width:100%;height:auto;border:0;margin-top:8px;margin-bottom:14px;`,
};

/**
 * CSS properties the editor is allowed to set per tag, layered on top of the base
 * style above. Each value is checked against an exact whitelist, not a regex, since
 * these come straight from user input (the compose editor).
 */
const CARRY_OVER: Record<string, { props: string[]; safeValues: Record<string, string[]> }> = {
  p: { props: ["text-align"], safeValues: { "text-align": ["left", "center", "right"] } },
  h2: { props: ["text-align"], safeValues: { "text-align": ["left", "center", "right"] } },
  h3: { props: ["text-align"], safeValues: { "text-align": ["left", "center", "right"] } },
  img: {
    props: ["margin-left", "margin-right"],
    safeValues: { "margin-left": ["auto", "0"], "margin-right": ["auto", "0"] },
  },
};

function parseStyle(style: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  for (const decl of style.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (prop && value) out[prop] = value;
  }
  return out;
}

function styleToString(styles: Record<string, string>): string {
  const entries = Object.entries(styles);
  if (!entries.length) return "";
  return entries.map(([prop, value]) => `${prop}:${value}`).join(";") + ";";
}

function mergedStyleTransform(tag: string): sanitizeHtml.Transformer {
  const base = parseStyle(BASE_STYLE[tag]);
  const carryOver = CARRY_OVER[tag];
  return (tagName, attribs) => {
    const incoming = parseStyle(attribs.style);
    const merged = { ...base };
    if (carryOver) {
      for (const prop of carryOver.props) {
        const value = incoming[prop];
        if (value && carryOver.safeValues[prop]?.includes(value)) {
          merged[prop] = value;
        }
      }
    }
    const { style: _style, ...rest } = attribs;
    return {
      tagName,
      attribs: { ...rest, style: styleToString(merged) },
    };
  };
}

/** Sanitizes rich text from the marketing email body editor and inlines email-safe styles. */
export function sanitizeMarketingBodyHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "blockquote",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "style"],
      img: ["src", "alt", "width", "style"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      blockquote: ["style"],
      ul: ["style"],
      ol: ["style"],
      li: ["style"],
      strong: ["style"],
      b: ["style"],
    },
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
      // "cid" lets send-time image inlining (lib/email/inline-image.ts) reference
      // attached image bytes directly, instead of a hosted URL every mail client
      // has to fetch on its own.
      img: ["http", "https", "cid"],
    },
    // No allowedStyles filter: mergedStyleTransform below fully controls the final
    // style string per tag (hardcoded base + an exact-value whitelist for editor
    // input), so there is nothing left for a generic property/value filter to check.
    transformTags: Object.fromEntries(
      Object.keys(BASE_STYLE).map((tag) => [tag, mergedStyleTransform(tag)]),
    ),
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  }).trim();
}

/** Plain-text fallback for the email alternative body and preheader default. */
export function emailHtmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const stripped = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} });
  return stripped
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
