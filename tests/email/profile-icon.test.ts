import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { emailLayout } from "../../lib/email/layout";
import { brandLogo, organizationJsonLd, siteUrl } from "../../lib/seo/site";

function pngSize(path: string) {
  const buf = readFileSync(path);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("email branding", () => {
  it("points Gmail and Apple Mail at a square PNG avatar", () => {
    assert.equal(brandLogo.path, "/icon.png");
    assert.equal(brandLogo.url, `${siteUrl}/icon.png`);
    assert.equal(brandLogo.width, brandLogo.height);
    assert.ok(brandLogo.width >= 112);
    assert.equal(organizationJsonLd.logo.url, `${siteUrl}/icon.png`);
    assert.equal(organizationJsonLd.logo.width, organizationJsonLd.logo.height);
    assert.equal(organizationJsonLd.image, `${siteUrl}/icon.png`);

    const icon = join(process.cwd(), "public/icon.png");
    assert.ok(existsSync(icon));
    const size = pngSize(icon);
    assert.equal(size.width, size.height);
    assert.ok(size.width >= 112);
  });

  it("ships a BIMI SVG Tiny PS mark for email client avatars", () => {
    const path = join(process.cwd(), "public/bimi.svg");
    assert.ok(existsSync(path));
    const svg = readFileSync(path, "utf8");
    assert.match(svg, /baseProfile="tiny-ps"/);
    assert.match(svg, /viewBox="0 0 512 512"/);
    assert.doesNotMatch(svg, /<script/i);
    assert.doesNotMatch(svg, /xlink:href|href="https?:\/\//);
  });

  it("uses the original wordmark in every email header", () => {
    const html = emailLayout({ headline: "Your sign-in code", bodyHtml: "<p>Hi</p>" });
    assert.match(html, /\/smslogo\.png/);
    assert.match(html, /alt="SplitSMS"/);
    assert.doesNotMatch(html, /\/logo\.png/);
    assert.doesNotMatch(html, /border-radius:50%/);
  });
});
