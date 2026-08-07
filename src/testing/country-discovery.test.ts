import type {
  DiscoveryCandidate,
  SourceEvidence,
} from "../features/discovery/model/types";

const evidence: SourceEvidence = {
  provider: "google_places",
  providerRecordId: "ChIJ-demo",
  sourceUrl: "https://maps.google.com/?cid=demo",
  fetchedAt: "2026-08-07T00:00:00.000Z",
  fields: ["name", "location", "rating"],
};

const candidate: DiscoveryCandidate = {
  candidateId: "google_places:ChIJ-demo",
  kind: "travel_area",
  countryCode: "TW",
  title: "Taroko Gorge",
  summary: "Marble gorge and trail area.",
  coordinates: { lat: 24.154, lng: 121.49 },
  evidence: [evidence],
};

void candidate;
