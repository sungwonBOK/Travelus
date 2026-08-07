import type {
  DiscoveryCandidate,
  TravelRegion,
} from "../../features/discovery/model/types";
import type {
  CandidateRegionAssignment,
  LodgingAreaSuggestion,
} from "../../features/region-suggestions/model/types";

const taiwanEvidence = {
  provider: "official_tourism",
  providerRecordId: "taiwan-demo",
  sourceUrl: "https://eng.taiwan.net.tw/",
  fetchedAt: "2026-08-08T00:00:00.000Z",
  fields: ["title", "summary", "coordinates"],
} as const;

export const taiwanTravelRegions: readonly TravelRegion[] = [
  {
    regionId: "taipei",
    countryCode: "TW",
    displayName: "Taipei",
    anchorCoordinates: { lat: 25.033, lng: 121.5654 },
  },
  {
    regionId: "hualien",
    countryCode: "TW",
    displayName: "Hualien",
    anchorCoordinates: { lat: 23.9911, lng: 121.6112 },
  },
  {
    regionId: "tainan",
    countryCode: "TW",
    displayName: "Tainan",
    anchorCoordinates: { lat: 22.9999, lng: 120.2269 },
  },
];

export const taiwanDiscoveryCandidates: readonly DiscoveryCandidate[] = [
  {
    candidateId: "taiwan:shilin-night-market",
    kind: "travel_area",
    countryCode: "TW",
    title: "Shilin Night Market",
    summary: "Taipei's well-known night market for food and shopping.",
    coordinates: { lat: 25.0877, lng: 121.524 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "shilin-night-market" }],
  },
  {
    candidateId: "taiwan:taipei-101",
    kind: "place",
    countryCode: "TW",
    title: "Taipei 101",
    summary: "Landmark tower with city views.",
    coordinates: { lat: 25.0339, lng: 121.5645 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "taipei-101" }],
  },
  {
    candidateId: "taiwan:taroko-gorge",
    kind: "travel_area",
    countryCode: "TW",
    title: "Taroko Gorge",
    summary: "Marble gorge and trail area in eastern Taiwan.",
    coordinates: { lat: 24.154, lng: 121.49 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "taroko-gorge" }],
  },
  {
    candidateId: "taiwan:qixingtan-beach",
    kind: "travel_area",
    countryCode: "TW",
    title: "Qixingtan Beach",
    summary: "Pebble beach near Hualien with Pacific views.",
    coordinates: { lat: 24.0315, lng: 121.6312 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "qixingtan-beach" }],
  },
  {
    candidateId: "taiwan:anping-tree-house",
    kind: "place",
    countryCode: "TW",
    title: "Anping Tree House",
    summary: "Historic warehouse complex reclaimed by banyan roots.",
    coordinates: { lat: 23.0015, lng: 120.1607 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "anping-tree-house" }],
  },
  {
    candidateId: "taiwan:chihkan-tower",
    kind: "place",
    countryCode: "TW",
    title: "Chihkan Tower",
    summary: "Historic site in central Tainan.",
    coordinates: { lat: 22.997, lng: 120.2028 },
    evidence: [{ ...taiwanEvidence, providerRecordId: "chihkan-tower" }],
  },
];

export const taiwanCandidateAssignments: readonly CandidateRegionAssignment[] = [
  { candidateId: "taiwan:shilin-night-market", regionId: "taipei" },
  { candidateId: "taiwan:taipei-101", regionId: "taipei" },
  { candidateId: "taiwan:taroko-gorge", regionId: "hualien" },
  { candidateId: "taiwan:qixingtan-beach", regionId: "hualien" },
  { candidateId: "taiwan:anping-tree-house", regionId: "tainan" },
  { candidateId: "taiwan:chihkan-tower", regionId: "tainan" },
];

export const taiwanLodgingAreas: readonly LodgingAreaSuggestion[] = [
  {
    lodgingAreaId: "taiwan:xinyi",
    regionId: "taipei",
    title: "Xinyi District",
    summary: "Central Taipei area near major landmarks and transit.",
    recommendedReason: "Convenient for a first stay in Taipei.",
  },
  {
    lodgingAreaId: "taiwan:hualien-city",
    regionId: "hualien",
    title: "Hualien City",
    summary: "A practical base for eastern Taiwan day trips.",
    recommendedReason: "Balances rail access and local dining.",
  },
  {
    lodgingAreaId: "taiwan:anping",
    regionId: "tainan",
    title: "Anping District",
    summary: "Historic waterfront district in Tainan.",
    recommendedReason: "Places heritage sites and evening walks nearby.",
  },
];
