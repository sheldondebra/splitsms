import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formDataToPayload, payloadToFormData } from "../../lib/offline/queue";

describe("offline queue payload helpers", () => {
  it("round-trips FormData string fields", () => {
    const formData = new FormData();
    formData.set("recipients", "233201234567");
    formData.set("body", "Hello");
    formData.set("senderId", "SplitSMS");

    const payload = formDataToPayload(formData);
    assert.equal(payload.body, "Hello");
    assert.equal(payload.recipients, "233201234567");

    const restored = payloadToFormData(payload);
    assert.equal(restored.get("body"), "Hello");
    assert.equal(restored.get("senderId"), "SplitSMS");
  });
});
