import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldClearFileTargetAfterDelete } from "./fileDeletedTarget.ts";

const file = (path: string) => ({
  id: path,
  name: path.split("/").pop() || "root",
  path,
  type: 0,
  size: 0,
  created_at: "2026-06-03T00:00:00Z",
  updated_at: "2026-06-03T00:00:00Z",
});

test("clears sidebar target when deleted file is the target", () => {
  assert.equal(
    shouldClearFileTargetAfterDelete(file("cloudreve://public/root/a.txt"), [file("cloudreve://public/root/a.txt")]),
    true,
  );
});

test("clears sidebar target when a deleted folder contains the target", () => {
  assert.equal(
    shouldClearFileTargetAfterDelete(file("cloudreve://public/root/sub/a.txt"), [file("cloudreve://public/root")]),
    true,
  );
});

test("matches target uri without search parameters", () => {
  assert.equal(
    shouldClearFileTargetAfterDelete(file("cloudreve://public/root/a.txt?version=old"), [
      file("cloudreve://public/root/a.txt"),
    ]),
    true,
  );
});

test("does not clear sidebar target for sibling path prefix", () => {
  assert.equal(
    shouldClearFileTargetAfterDelete(file("cloudreve://public/root-2/a.txt"), [file("cloudreve://public/root")]),
    false,
  );
});

test("does not clear sidebar target when target is missing", () => {
  assert.equal(shouldClearFileTargetAfterDelete(undefined, [file("cloudreve://public/root/a.txt")]), false);
});
