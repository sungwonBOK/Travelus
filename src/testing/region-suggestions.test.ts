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

test("proposes unselected nearby candidates and lodging areas for each selected region", () => {
  const workspace = createRegionSuggestionWorkspace({
    candidates: taiwanDiscoveryCandidates,
    regions: taiwanTravelRegions,
    assignments: taiwanCandidateAssignments,
    lodgingAreas: taiwanLodgingAreas,
    selections: [{ candidateId: "taiwan:shilin-night-market", selectionType: "keep" }],
  });

  const taipeiGroup = workspace.groups.find((group) => group.region.regionId === "taipei");

  assert.deepEqual(
    taipeiGroup?.nearbyCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:taipei-101"],
  );
  assert.deepEqual(
    taipeiGroup?.lodgingAreas.map((area) => area.lodgingAreaId),
    ["taiwan:xinyi"],
  );
});

test("does not propose hidden nearby candidates", () => {
  const nationalPalaceMuseum = {
    ...taiwanDiscoveryCandidates[0]!,
    candidateId: "taiwan:taipei-national-palace-museum",
  };
  const workspace = createRegionSuggestionWorkspace({
    candidates: [...taiwanDiscoveryCandidates, nationalPalaceMuseum],
    regions: taiwanTravelRegions,
    assignments: [
      ...taiwanCandidateAssignments,
      { candidateId: nationalPalaceMuseum.candidateId, regionId: "taipei" },
    ],
    lodgingAreas: taiwanLodgingAreas,
    selections: [
      { candidateId: "taiwan:taipei-101", selectionType: "keep" },
      { candidateId: nationalPalaceMuseum.candidateId, selectionType: "hide" },
    ],
  });

  const taipeiGroup = workspace.groups.find((group) => group.region.regionId === "taipei");

  assert.deepEqual(
    taipeiGroup?.nearbyCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:shilin-night-market"],
  );
});

test("limits nearby candidates to the first two in candidate input order", () => {
  const region = { ...taiwanTravelRegions[0]!, regionId: "test-region" };
  const candidates = ["selected", "first", "second", "third"].map((suffix) => ({
    ...taiwanDiscoveryCandidates[0]!,
    candidateId: `taiwan:test-${suffix}`,
  }));
  const workspace = createRegionSuggestionWorkspace({
    candidates,
    regions: [region],
    assignments: candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      regionId: region.regionId,
    })),
    lodgingAreas: [],
    selections: [{ candidateId: "taiwan:test-selected", selectionType: "keep" }],
  });

  assert.deepEqual(
    workspace.groups[0]?.nearbyCandidates.map((candidate) => candidate.candidateId),
    ["taiwan:test-first", "taiwan:test-second"],
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
