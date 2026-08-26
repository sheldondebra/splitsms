import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGoogleSpreadsheetId } from "../../lib/google/sheet-id";

describe("parseGoogleSpreadsheetId", () => {
  it("reads the ID from a Google Sheets URL", () => {
    assert.equal(
      parseGoogleSpreadsheetId(
        "https://docs.google.com/spreadsheets/d/1AbCDefGhIjkLMNOpqrstUVWxyz-1234567890ab/edit#gid=0",
      ),
      "1AbCDefGhIjkLMNOpqrstUVWxyz-1234567890ab",
    );
  });

  it("accepts a raw spreadsheet ID", () => {
    assert.equal(
      parseGoogleSpreadsheetId("1AbCDefGhIjkLMNOpqrstUVWxyz-1234567890ab"),
      "1AbCDefGhIjkLMNOpqrstUVWxyz-1234567890ab",
    );
  });

  it("rejects unrelated URLs", () => {
    assert.equal(parseGoogleSpreadsheetId("https://docs.google.com/forms/d/abc/edit"), null);
  });
});
