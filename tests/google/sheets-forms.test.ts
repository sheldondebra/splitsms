import assert from "node:assert/strict";
import test from "node:test";
import {
  inferPhoneColumn,
  rowsToContacts,
} from "../../lib/google/sheets";
import { renderTemplate } from "../../lib/google/forms";

test("inferPhoneColumn finds phone header", () => {
  assert.equal(inferPhoneColumn(["Name", "Mobile", "Email"]), 1);
});

test("rowsToContacts normalizes phones from sheet rows", () => {
  const rows = rowsToContacts(
    [
      ["Name", "Phone"],
      ["Ada", "+233244123456"],
      ["Bad", "not-a-phone"],
      ["Bob", "+233201112233"],
    ],
    { phoneCol: 1, nameCol: 0, hasHeader: true },
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.phone, "+233244123456");
  assert.equal(rows[0]?.name, "Ada");
});

test("renderTemplate replaces question titles and ids", () => {
  const out = renderTemplate(
    "Hi {{Name}}, phone {{q1}}",
    { q1: "+233200000000", q2: "Ada" },
    { q1: "Phone", q2: "Name" },
  );
  assert.equal(out, "Hi Ada, phone +233200000000");
});
