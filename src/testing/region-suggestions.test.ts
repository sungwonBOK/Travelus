import assert from "node:assert/strict";
import test from "node:test";

import { createRegionSuggestionWorkspace } from "../features/region-suggestions/model/region-suggestion-service";
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

test("groups kept and maybe Taiwan candidates by their assigned region", () => {
  const workspace = createRegionSuggestionWorkspace({
    candidates: taiwanDiscoveryCandidates,
    regions: taiwanTravelRegions,
    assignments: taiwanCandidateAssignments,
    lodgingAreas: taiwanLodgingAreas,
    selections: [
      { candidateId: "taiwan:shilin-night-market", selectionType: "keep" },
      { candidateId: "taiwan:taroko-gorge", selectionType: "keep" },
      { candidateId: "taiwan:anping-tree-house", selectionType: "maybe" },
    ],
  });

  assert.deepEqual(workspace.groups.map((group) => group.region.regionId), [
    "hualien",
    "taipei",
    "tainan",
  ]);
  assert.deepEqual(
    workspace.groups[0]?.keptCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:taroko-gorge"],
  );
  assert.deepEqual(
    workspace.groups[2]?.maybeCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:anping-tree-house"],
  );
});

test("omits hidden candidates and returns selected candidates without a known region", () => {
  const unassignedCandidate = {
    ...taiwanDiscoveryCandidates[0]!,
    candidateId: "taiwan:unassigned",
  };
  const workspace = createRegionSuggestionWorkspace({
    candidates: [...taiwanDiscoveryCandidates, unassignedCandidate],
    regions: taiwanTravelRegions,
    assignments: taiwanCandidateAssignments,
    lodgingAreas: taiwanLodgingAreas,
    selections: [
      { candidateId: "taiwan:taipei-101", selectionType: "hide" },
      { candidateId: "taiwan:unassigned", selectionType: "keep" },
    ],
  });

  assert.equal(
    workspace.groups.some((group) =>
      [...group.keptCandidates, ...group.maybeCandidates].some(
        (candidate) => candidate.candidateId === "taiwan:taipei-101",
      ),
    ),
    false,
  );
  assert.deepEqual(
    workspace.unassignedCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:unassigned"],
  );
});

test("uses first selections, returns unknown regions as unassigned, and preserves inputs", () => {
  const regions = taiwanTravelRegions.map((region) =>
    region.regionId === "taipei"
      ? { ...region, regionId: "Z" }
      : region.regionId === "hualien"
        ? { ...region, regionId: "a" }
        : region,
  );
  const assignments = taiwanCandidateAssignments.map((assignment) =>
    assignment.regionId === "taipei"
      ? { ...assignment, regionId: "Z" }
      : assignment.regionId === "hualien"
        ? { ...assignment, regionId: "a" }
        : assignment,
  );
  const selections = [
    { candidateId: "taiwan:shilin-night-market", selectionType: "keep" as const },
    { candidateId: "taiwan:shilin-night-market", selectionType: "maybe" as const },
    { candidateId: "taiwan:taroko-gorge", selectionType: "keep" as const },
    { candidateId: "taiwan:anping-tree-house", selectionType: "keep" as const },
  ];
  const unknownRegionAssignments = assignments.map((assignment) =>
    assignment.candidateId === "taiwan:anping-tree-house"
      ? { ...assignment, regionId: "unknown-region" }
      : assignment,
  );
  const input = {
    candidates: [...taiwanDiscoveryCandidates],
    regions,
    assignments: unknownRegionAssignments,
    lodgingAreas: [...taiwanLodgingAreas],
    selections,
  };
  const inputBefore = JSON.stringify(input);

  const workspace = createRegionSuggestionWorkspace(input);

  assert.deepEqual(workspace.groups.map((group) => group.region.regionId), ["Z", "a"]);
  assert.deepEqual(
    workspace.groups[0]?.keptCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:shilin-night-market"],
  );
  assert.deepEqual(
    workspace.groups[0]?.maybeCandidates.map((candidate) => candidate.candidateId),
    [],
  );
  assert.deepEqual(
    workspace.unassignedCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:anping-tree-house"],
  );
  assert.equal(JSON.stringify(input), inputBefore);
});
