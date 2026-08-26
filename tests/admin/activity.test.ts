import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activityPageList,
  buildActivityHref,
  parseActivityPage,
} from "../../lib/admin/activity-list-url";
import {
  collectPossibleUserIds,
  formatActivityMetadata,
  looksLikeCuid,
} from "../../lib/admin/activity-display";

describe("activity list urls", () => {
  it("parses pages and omits page 1 from the href", () => {
    assert.equal(parseActivityPage("3"), 3);
    assert.equal(parseActivityPage("nope"), 1);
    assert.equal(buildActivityHref({ q: "nana", page: 1 }), "/admin/activity?q=nana");
    assert.equal(
      buildActivityHref({ q: "nana", action: "login", page: 4 }),
      "/admin/activity?q=nana&action=login&page=4",
    );
  });

  it("collapses long page lists", () => {
    assert.deepEqual(activityPageList(1, 3), [1, 2, 3]);
    assert.deepEqual(activityPageList(20, 39), [1, "gap", 19, 20, 21, "gap", 39]);
  });
});

describe("activity display ids", () => {
  it("rewrites CUID user ids to the 6-digit account number", () => {
    const cuid = "cmsomvfvt000001s6yw7ifjrz";
    assert.equal(looksLikeCuid(cuid), true);
    const preview = formatActivityMetadata(
      { phone: "+22962368792", realUserId: cuid },
      { [cuid]: "482913" },
    );
    assert.equal(preview, "phone: +22962368792 · user: 482913");
  });

  it("collects CUID user ids from actor, entity, and metadata", () => {
    const actorId = "cmactor000000000000000001";
    const realUserId = "cmsomvfvt000001s6yw7ifjrz";
    const ids = collectPossibleUserIds([
      {
        entityId: actorId,
        actor: { id: actorId },
        metadata: { realUserId, phone: "+22962368792" },
      },
    ]);
    assert.deepEqual(ids.sort(), [actorId, realUserId].sort());
  });
});
