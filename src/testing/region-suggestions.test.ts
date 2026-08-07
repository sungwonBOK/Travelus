import assert from "node:assert/strict";
import test from "node:test";

import {
  taiwanCandidateAssignments,
  taiwanDiscoveryCandidates,
  taiwanLodgingAreas,
  taiwanTravelRegions,
} from "../demo/taiwan/region-suggestion-data";

test("Taiwan region suggestion fixture covers the initial country selection", () => {
  assert.equal(taiwanTravelRegions.length, 3);
  assert.equal(taiwanDiscoveryCandidates.length, 6);
  assert.equal(taiwanCandidateAssignments.length, taiwanDiscoveryCandidates.length);
  assert.equal(taiwanLodgingAreas[0]?.regionId, "taipei");
});
