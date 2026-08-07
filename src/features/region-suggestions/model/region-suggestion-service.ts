import type { DiscoveryCandidate, TravelRegion } from "../../discovery/model/types";
import type {
  CandidateRegionAssignment,
  CountryCandidateSelection,
  LodgingAreaSuggestion,
  RegionSuggestionGroup,
  RegionSuggestionWorkspace,
} from "./types";

export interface RegionSuggestionInput {
  readonly candidates: readonly DiscoveryCandidate[];
  readonly regions: readonly TravelRegion[];
  readonly assignments: readonly CandidateRegionAssignment[];
  readonly lodgingAreas: readonly LodgingAreaSuggestion[];
  readonly selections: readonly CountryCandidateSelection[];
}

export function createRegionSuggestionWorkspace(
  input: RegionSuggestionInput,
): RegionSuggestionWorkspace {
  const candidatesById = new Map(
    input.candidates.map((candidate) => [candidate.candidateId, candidate]),
  );
  const regionsById = new Map(
    input.regions.map((region) => [region.regionId, region]),
  );
  const assignmentsByCandidateId = new Map<string, string>();

  for (const assignment of input.assignments) {
    if (!assignmentsByCandidateId.has(assignment.candidateId)) {
      assignmentsByCandidateId.set(assignment.candidateId, assignment.regionId);
    }
  }

  const selectionsByCandidateId = new Map<string, CountryCandidateSelection>();
  for (const selection of input.selections) {
    if (!selectionsByCandidateId.has(selection.candidateId)) {
      selectionsByCandidateId.set(selection.candidateId, selection);
    }
  }

  const groupsByRegionId = new Map<
    string,
    {
      region: TravelRegion;
      keptCandidates: DiscoveryCandidate[];
      maybeCandidates: DiscoveryCandidate[];
    }
  >();
  const unassignedCandidates: DiscoveryCandidate[] = [];

  for (const selection of selectionsByCandidateId.values()) {
    if (selection.selectionType === "hide") {
      continue;
    }

    const candidate = candidatesById.get(selection.candidateId);
    if (!candidate) {
      continue;
    }

    const region = regionsById.get(assignmentsByCandidateId.get(candidate.candidateId) ?? "");
    if (!region) {
      unassignedCandidates.push(candidate);
      continue;
    }

    let group = groupsByRegionId.get(region.regionId);
    if (!group) {
      group = { region, keptCandidates: [], maybeCandidates: [] };
      groupsByRegionId.set(region.regionId, group);
    }

    if (selection.selectionType === "keep") {
      group.keptCandidates.push(candidate);
    } else {
      group.maybeCandidates.push(candidate);
    }
  }

  const groups: RegionSuggestionGroup[] = [...groupsByRegionId.values()]
    .sort(
      (left, right) =>
        right.keptCandidates.length - left.keptCandidates.length ||
        right.maybeCandidates.length - left.maybeCandidates.length ||
        left.region.regionId.localeCompare(right.region.regionId),
    )
    .map((group) => ({
      region: group.region,
      keptCandidates: group.keptCandidates,
      maybeCandidates: group.maybeCandidates,
      nearbyCandidates: [],
      lodgingAreas: [],
    }));

  return { groups, unassignedCandidates };
}
