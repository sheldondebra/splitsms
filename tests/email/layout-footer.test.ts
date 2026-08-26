import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { config } from "dotenv";
import { emailLayout, publicSiteHost } from "../../lib/email/layout";
import { accountWelcomeEmailContent } from "../../lib/email/templates";

config({ path: ".env" });

describe("email layout", () => {
  it("renders one footer with the public site host", () => {
    const html = emailLayout({
      headline: "Test",
      bodyHtml: "<p>Hello</p>",
      footerNote: "You are receiving this because you have a SplitSMS account.",
    });
    const host = publicSiteHost();
    assert.ok(host.startsWith("www."));
    assert.equal((html.match(new RegExp(host.replace(/\./g, "\\."), "g")) ?? []).length, 1);
    assert.doesNotMatch(html, /receiving this because/i);
  });

  it("keeps a custom footer note above the brand line", () => {
    const html = emailLayout({
      headline: "Invoice",
      bodyHtml: "<p>Due</p>",
      footerNote: "Invoice 1042",
    });
    assert.match(html, /Invoice 1042/);
    assert.match(html, /www\./);
  });
});

describe("welcome email", () => {
  it("includes login details, checklist, and Smart Forms without a password", async () => {
    const content = await accountWelcomeEmailContent({
      memberName: "Nana Asiama",
      email: "nana@example.com",
    });
    assert.match(content.text, /nana@example.com/);
    assert.match(content.text, /\/login/);
    assert.match(content.text, /\/forgot-password/);
    assert.match(content.text, /Smart Forms/);
    assert.match(content.html, /Get started/i);
    assert.doesNotMatch(`${content.subject}${content.text}${content.html}`, /ExistingPassword/);
  });
});
