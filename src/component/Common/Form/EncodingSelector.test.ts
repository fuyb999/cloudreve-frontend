import assert from "node:assert/strict";
import { test } from "node:test";
import { zipTextEncodings } from "./encodingOptions.ts";

test("encoding selector exposes utf8 as an explicit zip encoding option", () => {
  assert.equal(zipTextEncodings[0], "utf8");
  assert.equal(zipTextEncodings.includes("utf8"), true);
});
