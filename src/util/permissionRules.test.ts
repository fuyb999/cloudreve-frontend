import assert from "node:assert/strict";
import { test } from "node:test";
import { allowedCopyMoveDestinationFilesystems } from "./permissionRules.ts";

test("public files can be copied to personal and public folders", () => {
  assert.deepEqual(allowedCopyMoveDestinationFilesystems("public", true), ["my", "public"]);
});

test("public files can only be moved within public folders", () => {
  assert.deepEqual(allowedCopyMoveDestinationFilesystems("public", false), ["public"]);
});

test("personal files can be moved to personal, trash, and public folders", () => {
  assert.deepEqual(allowedCopyMoveDestinationFilesystems("my", false), ["my", "trash", "public"]);
});
