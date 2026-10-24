import assert from "node:assert/strict";
import { it, mock, afterEach } from "node:test";
const mod = (path: string) => new URL(`../../../lib/${path}.ts`, import.meta.url).href;
mock.module(mod("mnotify-settings"), { namedExports: { loadMnotifySettings: async () => ({ enabled: true, apiKey: "test-only", baseUrl: "https://unused.invalid", defaultSenderId: "Test" }) } });
mock.module(mod("mnotify/balance"), { namedExports: { cacheBalanceFromMnotifyResponse: () => null, saveMnotifyBalanceCache: async () => {} } });
const { sendMnotifyQuickSms } = await import("../../../lib/mnotify");
const params = { recipients: ["+233240000000"], sender: "Test", message: "Test" };
afterEach(() => { mock.restoreAll(); delete process.env.MNOTIFY_MAINTENANCE_START; delete process.env.MNOTIFY_MAINTENANCE_END; });
it("does no network I/O during maintenance", async () => {
  process.env.MNOTIFY_MAINTENANCE_START = "2020-01-01T00:00:00Z";
  process.env.MNOTIFY_MAINTENANCE_END = "2040-01-01T00:00:00Z";
  const fetch = mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network"); });
  const result = await sendMnotifyQuickSms(params);
  assert.equal(result.ok, false); assert.equal(result.outcome, "deferred"); assert.equal(fetch.mock.callCount(), 0);
});
for (const [name, response] of [
  ["timeout", () => { throw new Error("timeout"); }],
  ["server failure", () => new Response('{"message":"unavailable"}', { status: 503 })],
  ["invalid JSON", () => new Response("maintenance", { status: 200 })],
  ["unrecognised response", () => Response.json({})],
] as const) {
  it(`quarantines ${name} as unknown acceptance`, async () => {
    mock.method(globalThis, "fetch", async () => response());
    const result = await sendMnotifyQuickSms(params);
    assert.equal(result.ok, false); assert.equal(result.outcome, "unknown");
  });
}
it("preserves a known acceptance reference and sends only once", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => Response.json({ status: "success", code: "2000", summary: { _id: "campaign-1" } }));
  const result = await sendMnotifyQuickSms(params);
  assert.equal(result.ok, true); assert.equal(result.providerRef, "campaign-1"); assert.equal(fetch.mock.callCount(), 1);
});
it("allows definite authentication rejection to use normal failure handling", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Invalid key" }, { status: 401 }));
  const result = await sendMnotifyQuickSms(params);
  assert.equal(result.ok, false); assert.equal(result.outcome, undefined);
});
