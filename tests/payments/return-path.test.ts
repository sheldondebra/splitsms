import assert from "node:assert/strict";
import test from "node:test";
import {
  firstSearchParam,
  sanitizeWalletReturnPath,
  walletCallbackUrl,
} from "../../lib/payments/return-path";

test("firstSearchParam returns a single string as-is", () => {
  assert.equal(firstSearchParam("cmseq6dzk003y01s6omprciq4"), "cmseq6dzk003y01s6omprciq4");
});

test("firstSearchParam picks the first value when Paystack duplicates reference", () => {
  // Paystack appends reference/trxref onto callback URLs that already include reference=
  assert.equal(
    firstSearchParam(["cmseq6dzk003y01s6omprciq4", "cmseq6dzk003y01s6omprciq4"]),
    "cmseq6dzk003y01s6omprciq4",
  );
});

test("firstSearchParam returns undefined for empty/missing values", () => {
  assert.equal(firstSearchParam(undefined), undefined);
  assert.equal(firstSearchParam([]), undefined);
  assert.equal(firstSearchParam(""), undefined);
});

test("Paystack callback URL includes provider but not reference (Paystack appends it)", () => {
  const url = walletCallbackUrl("https://www.splitsms.com", "/dashboard/wallet", {
    provider: "paystack",
  });
  assert.equal(url, "https://www.splitsms.com/dashboard/wallet?provider=paystack");
  assert.equal(url.includes("reference="), false);
});

test("sanitizeWalletReturnPath rejects open redirects", () => {
  assert.equal(sanitizeWalletReturnPath("https://evil.example/phish"), "/dashboard/wallet");
  assert.equal(sanitizeWalletReturnPath("/reseller/wallet"), "/reseller/wallet");
});
