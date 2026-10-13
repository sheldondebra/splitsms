import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  creditRevertQuote,
  gatewayRefundReadiness,
  refundWalletCover,
  walletValueForCredits,
} from "../../lib/admin/credit-revert-quote";

describe("creditRevertQuote", () => {
  it("values unused credits at the rate the member paid", () => {
    const quote = creditRevertQuote({
      unusedCredits: 222,
      purchasedCredits: 100,
      purchasedAmount: 5,
      catalogPricePerCredit: 0.08,
    });
    assert.equal(quote.rate, 0.05);
    assert.equal(quote.rateSource, "purchases");
    assert.equal(quote.suggestedCredits, 100);
    assert.equal(walletValueForCredits(quote.suggestedCredits, quote.rate), 5);
    assert.equal(walletValueForCredits(222, quote.rate), 11.1);
  });

  it("refuses to cash out credits that were not purchased", () => {
    const quote = creditRevertQuote({
      unusedCredits: 222,
      purchasedCredits: 100,
      purchasedAmount: 5,
      catalogPricePerCredit: 0.05,
      alreadyRevertedCredits: 40,
    });
    assert.equal(quote.cashableCredits, 60);
    assert.equal(quote.suggestedCredits, 60);
  });

  it("does not turn signup credits into wallet money", () => {
    const quote = creditRevertQuote({
      unusedCredits: 5,
      purchasedCredits: 0,
      purchasedAmount: 0,
      catalogPricePerCredit: 0.05,
    });
    assert.equal(quote.rateSource, "catalog");
    assert.equal(quote.cashableCredits, 0);
  });
});

describe("refundWalletCover", () => {
  it("requires the wallet to cover a refund of money that was already credited", () => {
    assert.equal(
      refundWalletCover({ paymentWasCredited: true, walletBalance: 3, amount: 4 }).covered,
      false,
    );
    assert.equal(
      refundWalletCover({ paymentWasCredited: true, walletBalance: 4, amount: 4 }).covered,
      true,
    );
  });

  it("allows a refund when the payment never reached the wallet", () => {
    const cover = refundWalletCover({
      paymentWasCredited: false,
      walletBalance: 0,
      amount: 4,
    });
    assert.equal(cover.required, false);
    assert.equal(cover.covered, true);
  });
});

describe("gatewayRefundReadiness", () => {
  it("marks Paystack ready only when it is enabled and has a secret", () => {
    assert.equal(
      gatewayRefundReadiness({ provider: "PAYSTACK", enabled: true, hasSecret: true }).ready,
      true,
    );
    assert.equal(
      gatewayRefundReadiness({ provider: "PAYSTACK", enabled: true, hasSecret: false }).ready,
      false,
    );
    assert.match(
      gatewayRefundReadiness({ provider: "STRIPE", enabled: false, hasSecret: true }).detail,
      /turned off/,
    );
  });
});
