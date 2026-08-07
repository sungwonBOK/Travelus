import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import {
  createDiscoveryRouteDependencies,
  handleDiscoveryRequest,
} from "../app/api/discovery/route";

import {
  createGooglePlacesProvider,
} from "../features/discovery/model/google-places-provider";
import {
  ProviderUnavailableError,
} from "../features/discovery/model/place-search-provider";
import { searchCountryCandidates } from "../features/discovery/model/discovery-service";

import type {
  CountrySearchInput,
  PlaceSearchProvider,
} from "../features/discovery/model/place-search-provider";
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

test("discovery route returns configured search candidates", async () => {
  const provider: PlaceSearchProvider = {
    search: async () => [candidate],
  };
  const response = await handleDiscoveryRequest(
    new NextRequest(
      "http://localhost/api/discovery?countryCode=TW&countryName=Taiwan&query=night%20market",
    ),
    createDiscoveryRouteDependencies({ apiKey: "test-key", provider }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { candidates: [candidate] });
});

test("discovery route rejects an invalid request", async () => {
  const provider: PlaceSearchProvider = {
    search: async () => [candidate],
  };
  const response = await handleDiscoveryRequest(
    new NextRequest(
      "http://localhost/api/discovery?countryCode=TW&countryName=Taiwan&query=a",
    ),
    createDiscoveryRouteDependencies({ apiKey: "test-key", provider }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid discovery request" });
});

test("discovery route reports missing live configuration", async () => {
  const response = await handleDiscoveryRequest(
    new NextRequest(
      "http://localhost/api/discovery?countryCode=TW&countryName=Taiwan&query=night%20market",
    ),
    createDiscoveryRouteDependencies({ apiKey: "" }),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Live discovery is not configured" });
});

test("discovery route exposes an unavailable provider response", async () => {
  const provider: PlaceSearchProvider = {
    search: async () => {
      throw new ProviderUnavailableError("google_places");
    },
  };
  const response = await handleDiscoveryRequest(
    new NextRequest(
      "http://localhost/api/discovery?countryCode=TW&countryName=Taiwan&query=night%20market",
    ),
    createDiscoveryRouteDependencies({ apiKey: "test-key", provider }),
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "Discovery provider is unavailable" });
});

test("Google Places maps a geographic attraction into a travel area", async () => {
  const provider = createGooglePlacesProvider({
    apiKey: "test-key",
    fetchImpl: async () =>
      new Response(JSON.stringify({
        places: [{
          id: "ChIJ-taroko",
          displayName: { text: "Taroko Gorge" },
          primaryType: "tourist_attraction",
          location: { latitude: 24.154, longitude: 121.49 },
          googleMapsUri: "https://maps.google.com/?cid=taroko",
          rating: 4.8,
          userRatingCount: 12345,
          regularOpeningHours: { weekdayDescriptions: ["Monday: Open 24 hours"] },
        }],
      }), { status: 200 }),
  });

  const [mappedCandidate] = await provider.search({
    countryCode: "TW",
    countryName: "Taiwan",
    query: "gorge",
  });

  assert.equal(mappedCandidate?.kind, "travel_area");
  assert.equal(mappedCandidate?.countryCode, "TW");
  assert.equal(mappedCandidate?.evidence[0]?.provider, "google_places");
});

test("Google Places exposes an unavailable provider response", async () => {
  const provider = createGooglePlacesProvider({
    apiKey: "test-key",
    fetchImpl: async () => new Response("upstream failure", { status: 503 }),
  });

  await assert.rejects(
    () => provider.search({ countryCode: "TW", countryName: "Taiwan", query: "night market" }),
    ProviderUnavailableError,
  );
});

test("country search trims input before calling its provider", async () => {
  const calls: CountrySearchInput[] = [];
  const provider: PlaceSearchProvider = {
    search: async (input) => {
      calls.push(input);
      return [];
    },
  };

  await searchCountryCandidates(
    { countryCode: " TW ", countryName: " Taiwan ", query: " night market " },
    provider,
  );

  assert.deepEqual(calls, [{ countryCode: "TW", countryName: "Taiwan", query: "night market" }]);
});

test("country search rejects blank country data without calling its provider", async () => {
  let callCount = 0;
  const provider: PlaceSearchProvider = {
    search: async () => {
      callCount += 1;
      return [];
    },
  };

  await assert.rejects(
    () => searchCountryCandidates({ countryCode: " ", countryName: "Taiwan", query: "night market" }, provider),
    /Country is required/,
  );

  assert.equal(callCount, 0);
});

test("country search rejects a blank country name without calling its provider", async () => {
  let callCount = 0;
  const provider: PlaceSearchProvider = {
    search: async () => {
      callCount += 1;
      return [];
    },
  };

  await assert.rejects(
    () => searchCountryCandidates({ countryCode: "TW", countryName: " ", query: "night market" }, provider),
    /Country is required/,
  );

  assert.equal(callCount, 0);
});

test("country search rejects a one-character query without calling its provider", async () => {
  let callCount = 0;
  const provider: PlaceSearchProvider = {
    search: async () => {
      callCount += 1;
      return [];
    },
  };

  await assert.rejects(
    () => searchCountryCandidates({ countryCode: "TW", countryName: "Taiwan", query: "a" }, provider),
    /at least two characters/,
  );

  assert.equal(callCount, 0);
});

test("country search rejects a whitespace-padded one-character query without calling its provider", async () => {
  let callCount = 0;
  const provider: PlaceSearchProvider = {
    search: async () => {
      callCount += 1;
      return [];
    },
  };

  await assert.rejects(
    () => searchCountryCandidates({ countryCode: "TW", countryName: "Taiwan", query: " a " }, provider),
    /at least two characters/,
  );

  assert.equal(callCount, 0);
});
