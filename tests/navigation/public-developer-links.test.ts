import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicDeveloperFallback } from "../../lib/navigation/public-developer-links";

describe("publicDeveloperFallback", () => {
  it("sends logged-out visitors to public docs instead of login", () => {
    assert.equal(publicDeveloperFallback("/developers"), "/docs");
    assert.equal(publicDeveloperFallback("/developers/docs"), "/docs");
    assert.equal(publicDeveloperFallback("/developers/generate"), "/vibe-coders");
    assert.equal(publicDeveloperFallback("/developers/prompts"), "/vibe-coders");
    assert.equal(
      publicDeveloperFallback("/developers/postman"),
      "/postman/splitsms.collection.json",
    );
    assert.equal(publicDeveloperFallback("/developers/integrations"), "/integrations");
    assert.equal(publicDeveloperFallback("/developers/webhooks"), "/docs#webhooks");
  });

  it("leaves key and log routes on the login wall", () => {
    assert.equal(publicDeveloperFallback("/developers/api-keys"), null);
    assert.equal(publicDeveloperFallback("/developers/logs"), null);
  });
});
