import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultOpenGraphImages, siteUrl } from "../../lib/seo/site";
import { buildPageMetadata, shareDescription, shareTitle } from "../../lib/seo/metadata";

describe("social share metadata", () => {
  it("points Facebook and WhatsApp at an absolute 1200x630 PNG", () => {
    const image = defaultOpenGraphImages[0];
    assert.equal(image.url, `${siteUrl}/og.png`);
    assert.equal(image.secureUrl, `${siteUrl}/og.png`);
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.equal(image.type, "image/png");
    assert.match(image.url, /^https:\/\//);
  });

  it("includes a large-image Twitter card and canonical OG url on inner pages", () => {
    const meta = buildPageMetadata({
      title: "SMS Pricing by Country",
      description: "Transparent bulk SMS rates.",
      path: "/pricing",
    });

    assert.equal(meta.openGraph?.url, `${siteUrl}/pricing`);
    assert.equal(meta.openGraph?.locale, "en_US");
    const twitter = meta.twitter;
    assert.ok(twitter && "card" in twitter);
    assert.equal("card" in twitter ? twitter.card : undefined, "summary_large_image");
    assert.equal("title" in twitter ? twitter.title : undefined, "SMS Pricing by Country");
    const images = meta.openGraph?.images;
    assert.ok(Array.isArray(images));
    assert.equal((images[0] as { url: string }).url, `${siteUrl}/og.png`);
  });

  it("keeps homepage share copy short enough for WhatsApp", () => {
    assert.ok(shareTitle.length < 70);
    assert.ok(shareDescription.length < 160);
    assert.equal(shareTitle.includes("—"), false);
  });
});
