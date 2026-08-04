import assert from "node:assert/strict";
import test from "node:test";
import { isNativeGoogleSpreadsheet } from "../../lib/google/sheets";

test("isNativeGoogleSpreadsheet accepts only Google Sheets mime type", () => {
  assert.equal(
    isNativeGoogleSpreadsheet("application/vnd.google-apps.spreadsheet"),
    true,
  );
  assert.equal(
    isNativeGoogleSpreadsheet(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    false,
  );
  assert.equal(isNativeGoogleSpreadsheet("application/vnd.ms-excel"), false);
});
