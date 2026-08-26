import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { invoiceSummary, parseInvoiceItems, serializeInvoice } from "../../lib/billing/invoice-format";

describe("parseInvoiceItems", () => {
  it("reads description, amount, and credits from JSON rows", () => {
    const items = parseInvoiceItems([
      { description: "Wallet top-up via PAYSTACK", amount: 50, currency: "GHS" },
      { description: "SMS credits", amount: 20, credits: 400 },
    ]);
    assert.equal(items.length, 2);
    assert.equal(items[0].description, "Wallet top-up via PAYSTACK");
    assert.equal(items[1].credits, 400);
  });

  it("ignores invalid rows", () => {
    assert.deepEqual(parseInvoiceItems(null), []);
    assert.equal(parseInvoiceItems(["x", { description: "Ok", amount: "12" }]).length, 1);
  });
});

describe("serializeInvoice", () => {
  it("turns a Prisma-like invoice into a client row", () => {
    const row = serializeInvoice({
      id: "inv_1",
      invoiceNo: "INV-202608-ABC123",
      amount: { toNumber: () => 50 },
      currency: "GHS",
      status: "PAID",
      createdAt: new Date("2026-08-10T12:00:00.000Z"),
      items: [{ description: "Wallet top-up", amount: 50 }],
    });
    assert.equal(row.invoiceNo, "INV-202608-ABC123");
    assert.equal(row.amount, 50);
    assert.equal(invoiceSummary(row.items), "Wallet top-up");
  });
});
