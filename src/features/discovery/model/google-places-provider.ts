import {
  ProviderUnavailableError,
} from "./place-search-provider";

import type {
  CountrySearchInput,
  PlaceSearchProvider,
} from "./place-search-provider";
import type {
  DiscoveryCandidate,
  DiscoveryCandidateKind,
  SourceEvidence,
} from "./types";

const GOOGLE_PLACES_PROVIDER = "google_places";
const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.location",
  "places.googleMapsUri",
].join(",");
const TRAVEL_AREA_TYPES = new Set([
  "tourist_attraction",
  "natural_feature",
  "park",
  "neighborhood",
]);

interface GooglePlace {
  readonly id: string;
  readonly displayName: { readonly text: string };
  readonly primaryType?: string;
  readonly location?: { readonly latitude: number; readonly longitude: number };
  readonly googleMapsUri?: string;
}

interface GooglePlacesSearchResponse {
  readonly places: readonly GooglePlace[];
}

export interface GooglePlacesProviderOptions {
  readonly apiKey: string;
  readonly fetchImpl?: typeof fetch;
}

export function createGooglePlacesProvider(
  options: GooglePlacesProviderOptions,
): PlaceSearchProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async search(input: CountrySearchInput): Promise<readonly DiscoveryCandidate[]> {
      let response: Response;

      try {
        response = await fetchImpl(SEARCH_TEXT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": options.apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({ textQuery: `${input.query} in ${input.countryName}` }),
        });
      } catch {
        throw new ProviderUnavailableError(GOOGLE_PLACES_PROVIDER);
      }

      if (!response.ok) {
        throw new ProviderUnavailableError(GOOGLE_PLACES_PROVIDER);
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new ProviderUnavailableError(GOOGLE_PLACES_PROVIDER);
      }

      if (!isGooglePlacesSearchResponse(payload)) {
        throw new ProviderUnavailableError(GOOGLE_PLACES_PROVIDER);
      }

      return payload.places.map((place) => mapPlace(place, input));
    },
  };
}

function mapPlace(
  place: GooglePlace,
  input: CountrySearchInput,
): DiscoveryCandidate {
  const evidence: SourceEvidence = {
    provider: GOOGLE_PLACES_PROVIDER,
    providerRecordId: place.id,
    ...(place.googleMapsUri === undefined
      ? {}
      : { sourceUrl: place.googleMapsUri }),
    fetchedAt: new Date().toISOString(),
    fields: getReceivedFields(place),
  };

  return {
    candidateId: `${GOOGLE_PLACES_PROVIDER}:${place.id}`,
    kind: getCandidateKind(place.primaryType),
    countryCode: input.countryCode,
    title: place.displayName.text,
    coordinates: hasCoordinates(place.location)
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : undefined,
    evidence: [evidence],
  };
}

function getReceivedFields(place: GooglePlace): readonly string[] {
  return [
    "id",
    "displayName",
    ...(place.primaryType === undefined ? [] : ["primaryType"]),
    ...(place.location === undefined ? [] : ["location"]),
    ...(place.googleMapsUri === undefined ? [] : ["googleMapsUri"]),
  ];
}

function getCandidateKind(primaryType: string | undefined): DiscoveryCandidateKind {
  return primaryType && TRAVEL_AREA_TYPES.has(primaryType)
    ? "travel_area"
    : "place";
}

function isGooglePlacesSearchResponse(
  payload: unknown,
): payload is GooglePlacesSearchResponse {
  if (!isRecord(payload) || !Array.isArray(payload.places)) {
    return false;
  }

  return payload.places.every(isGooglePlace);
}

function isGooglePlace(value: unknown): value is GooglePlace {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isRecord(value.displayName) &&
    typeof value.displayName.text === "string" &&
    (value.googleMapsUri === undefined || typeof value.googleMapsUri === "string") &&
    (value.primaryType === undefined || typeof value.primaryType === "string") &&
    (value.location === undefined || hasCoordinates(value.location))
  );
}

function hasCoordinates(
  value: unknown,
): value is { readonly latitude: number; readonly longitude: number } {
  return (
    isRecord(value) &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
