import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  SMS_LOGO_ASPECT,
  SMS_LOGO_DARK_ASPECT,
  SMS_LOGO_DARK_SRC,
  SMS_LOGO_SRC,
} from "../../components/brand/logo";

const DARK_LOGO_SHA256 = "81ff29d6a3aff2dab4b86fe1e8cebfb05070fdf22bec36126a028631495e26cd";

describe("dark-mode wordmark", () => {
  it("serves the uploaded white mark unchanged", () => {
    assert.equal(SMS_LOGO_SRC, "/smslogo.png");
    assert.equal(SMS_LOGO_DARK_SRC, "/smslogo-dark.png");
    assert.ok(SMS_LOGO_DARK_ASPECT > SMS_LOGO_ASPECT);
    const path = join(process.cwd(), "public/smslogo-dark.png");
    assert.ok(existsSync(path));
    const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
    assert.equal(hash, DARK_LOGO_SHA256);
  });
});
