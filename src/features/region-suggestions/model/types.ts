import type {
  DiscoveryCandidate,
  TravelRegion,
} from "../../discovery/model/types";

export type CountryCandidateSelectionType = "keep" | "maybe" | "hide";

export interface CountryCandidateSelection {
  readonly candidateId: string;
  readonly selectionType: CountryCandidateSelectionType;
}

export interface CandidateRegionAssignment {
  readonly candidateId: string;
  readonly regionId: string;
}

export interface LodgingAreaSuggestion {
  readonly lodgingAreaId: string;
  readonly regionId: string;
  readonly title: string;
  readonly summary: string;
  readonly recommendedReason: string;
}

export interface RegionSuggestionGroup {
  readonly region: TravelRegion;
  readonly keptCandidates: readonly DiscoveryCandidate[];
  readonly maybeCandidates: readonly DiscoveryCandidate[];
  readonly nearbyCandidates: readonly DiscoveryCandidate[];
  readonly lodgingAreas: readonly LodgingAreaSuggestion[];
}

export interface RegionSuggestionWorkspace {
  readonly groups: readonly RegionSuggestionGroup[];
  readonly unassignedCandidates: readonly DiscoveryCandidate[];
}
