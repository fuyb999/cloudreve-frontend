import assert from "node:assert/strict";
import { test } from "node:test";
import { canShowCreateArchiveAction } from "./actionDisplayRules.ts";

test("create archive requires both navigator archive capability and group archive task permission", () => {
  assert.equal(
    canShowCreateArchiveAction({
      hasReadable: true,
      hasCurrentUser: true,
      hasArchiveTaskPermission: true,
      hasCreateArchiveCapability: true,
    }),
    true,
  );
  assert.equal(
    canShowCreateArchiveAction({
      hasReadable: true,
      hasCurrentUser: true,
      hasArchiveTaskPermission: false,
      hasCreateArchiveCapability: true,
    }),
    false,
  );
  assert.equal(
    canShowCreateArchiveAction({
      hasReadable: true,
      hasCurrentUser: true,
      hasArchiveTaskPermission: true,
      hasCreateArchiveCapability: false,
    }),
    false,
  );
});
