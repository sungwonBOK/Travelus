import type { Coordinates } from "../../../entities/place/model/types";

export type DiscoveryCandidateKind =
  | "place"
  | "travel_area"
  | "experience"
  | "offer";

export interface Country {
  readonly countryCode: string;
  readonly displayName: string;
  readonly regionCode: string;
}

export interface TravelRegion {
  readonly regionId: string;
  readonly countryCode: string;
  readonly displayName: string;
  readonly anchorCoordinates?: Coordinates;
}

export interface SourceEvidence {
  readonly provider: "google_places" | "official_tourism" | "offer_partner";
  readonly providerRecordId: string;
  readonly sourceUrl?: string;
  readonly fetchedAt: string;
  readonly fields: readonly string[];
}

export interface DiscoveryCandidate {
  readonly candidateId: string;
  readonly kind: DiscoveryCandidateKind;
  readonly countryCode: string;
  readonly title: string;
  readonly summary?: string;
  readonly coordinates?: Coordinates;
  readonly evidence: readonly SourceEvidence[];
}
