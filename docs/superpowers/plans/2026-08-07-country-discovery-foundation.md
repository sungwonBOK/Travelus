# Country Discovery Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-side, provider-neutral country discovery boundary that returns normalized country-wide candidates without changing the current curated Taipei planning flow.

**Architecture:** Create a `discovery` feature that owns country, area, experience, offer, and evidence types. A Google Places adapter maps only the fields needed for country-wide candidate discovery into those types; a Next route validates the request and hides the provider key. This foundation deliberately has no UI replacement, no itinerary mutation, and no booking flow.

**Tech Stack:** Next.js 16 route handlers, TypeScript 5, native `fetch`, Node test runner, existing ESLint and TypeScript configuration.

## Global Constraints

- Work only in `D:\Projects\Travelus`.
- Add no production dependency.
- Keep API keys server-side in `GOOGLE_MAPS_API_KEY`; never expose the key in a client component or commit it.
- Keep existing Taipei demo, snapshot schema, `/` behavior, and `test:domain` command name intact.
- Use deterministic fixtures for all automated tests; no test calls a live provider.
- Treat a provider failure as unavailable discovery data, never as a reason to delete a user plan.

---

## File Structure

- `src/features/discovery/model/types.ts`: normalized discovery model and source evidence.
- `src/features/discovery/model/place-search-provider.ts`: provider contract and typed unavailable error.
- `src/features/discovery/model/google-places-provider.ts`: Google Places response mapping through an injected `fetch` implementation.
- `src/features/discovery/model/discovery-service.ts`: validates a country-wide search request before calling a provider.
- `src/app/api/discovery/route.ts`: server-only HTTP boundary for discovery.
- `src/testing/country-discovery.test.ts`: deterministic contract and failure tests.
- `package.json`: adds the new compiled test file to `test:domain`.
- `.env.example`: documents the required server-side key without a value.
- `README.md`: explains that live discovery needs the documented key and remains separate from booking.

## Task 1: Define normalized country discovery records

**Files:**
- Create: `src/features/discovery/model/types.ts`
- Test: `src/testing/country-discovery.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `Country`, `TravelRegion`, `DiscoveryCandidate`, and `SourceEvidence` for every later task.
- `DiscoveryCandidate.kind` is one of `place`, `travel_area`, `experience`, or `offer`.

- [ ] **Step 1: Write the failing type-contract test**

```ts
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
```

- [ ] **Step 2: Run the domain test to verify it fails**

Run: `npm run test:domain`

Expected: TypeScript reports that `../features/discovery/model/types` does not exist.

- [ ] **Step 3: Add the normalized types and register the test file**

```ts
import type { Coordinates } from "../../../entities/place/model/types";

export type DiscoveryCandidateKind =
  | "place"
  | "travel_area"
  | "experience"
  | "offer";

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
```

Add `Country` with `countryCode`, `displayName`, and `regionCode`; add
`TravelRegion` with `regionId`, `countryCode`, `displayName`, and optional
`anchorCoordinates`. Keep them independent of provider payloads.

Update the existing `test:domain` script at the same time so the new compiled
test is executed by every later task:

```json
"test:domain": "tsc -p tsconfig.domain-test.json && node --test .tmp/domain-tests/src/testing/domain-integration.test.js .tmp/domain-tests/src/testing/core-flow.test.js .tmp/domain-tests/src/testing/country-discovery.test.js"
```

- [ ] **Step 4: Run the domain test to verify it passes**

Run: `npm run test:domain`

Expected: the existing 24 tests pass and the new type-contract file compiles.

- [ ] **Step 5: Commit**

```bash
git add package.json src/features/discovery/model/types.ts src/testing/country-discovery.test.ts
git commit -m "feat: define country discovery records"
```

## Task 2: Add the provider contract and Google Places mapper

**Files:**
- Create: `src/features/discovery/model/place-search-provider.ts`
- Create: `src/features/discovery/model/google-places-provider.ts`
- Modify: `src/testing/country-discovery.test.ts`

**Interfaces:**
- Consumes `DiscoveryCandidate` from Task 1.
- Produces `PlaceSearchProvider.search(input): Promise<readonly DiscoveryCandidate[]>`.
- `createGooglePlacesProvider(options)` accepts an injected fetch function for deterministic tests.

- [ ] **Step 1: Write failing mapper and unavailable-provider tests**

```ts
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
        }],
      }), { status: 200 }),
  });

  const [candidate] = await provider.search({
    countryCode: "TW",
    countryName: "Taiwan",
    query: "gorge",
  });

  assert.equal(candidate?.kind, "travel_area");
  assert.equal(candidate?.countryCode, "TW");
  assert.equal(candidate?.evidence[0]?.provider, "google_places");
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
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:domain`

Expected: module-not-found errors for the provider contract and mapper.

- [ ] **Step 3: Implement the contract and mapper**

```ts
export interface CountrySearchInput {
  readonly countryCode: string;
  readonly countryName: string;
  readonly query: string;
}

export interface PlaceSearchProvider {
  search(input: CountrySearchInput): Promise<readonly DiscoveryCandidate[]>;
}

export class ProviderUnavailableError extends Error {
  constructor(readonly provider: string) {
    super(`${provider} is unavailable`);
  }
}
```

`createGooglePlacesProvider` must POST to Google Places Text Search with the
query `${input.query} in ${input.countryName}` and a narrow field mask for
`id`, `displayName`, `primaryType`, `location`, and `googleMapsUri`. Evidence
lists only fields actually present on each provider record; an absent optional
`googleMapsUri` leaves `sourceUrl` absent rather than fabricating one. Map
`tourist_attraction`, `natural_feature`, `park`, and `neighborhood` to
`travel_area`; map all other results to `place`. Throw
`ProviderUnavailableError("google_places")` for a non-OK response or malformed
payload. Do not log the key or raw payload.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:domain`

Expected: the two new provider tests and all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/discovery/model/place-search-provider.ts src/features/discovery/model/google-places-provider.ts src/testing/country-discovery.test.ts
git commit -m "feat: add Google Places discovery adapter"
```

## Task 3: Validate country search before it reaches a provider

**Files:**
- Create: `src/features/discovery/model/discovery-service.ts`
- Modify: `src/testing/country-discovery.test.ts`

**Interfaces:**
- Consumes `CountrySearchInput` and `PlaceSearchProvider` from Task 2.
- Produces `searchCountryCandidates(input, provider)`.
- Rejects blank country data and a query shorter than two trimmed characters.

- [ ] **Step 1: Write failing validation tests**

```ts
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

test("country search rejects a one-character query without calling its provider", async () => {
  await assert.rejects(
    () => searchCountryCandidates({ countryCode: "TW", countryName: "Taiwan", query: "a" }, failingProvider),
    /at least two characters/,
  );
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:domain`

Expected: module-not-found errors for `discovery-service`.

- [ ] **Step 3: Implement the service**

```ts
export async function searchCountryCandidates(
  input: CountrySearchInput,
  provider: PlaceSearchProvider,
): Promise<readonly DiscoveryCandidate[]> {
  const normalized = {
    countryCode: input.countryCode.trim().toUpperCase(),
    countryName: input.countryName.trim(),
    query: input.query.trim(),
  };

  if (!normalized.countryCode || !normalized.countryName) {
    throw new Error("Country is required");
  }
  if (normalized.query.length < 2) {
    throw new Error("Search query must contain at least two characters");
  }

  return provider.search(normalized);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:domain`

Expected: all country discovery tests and the 24 existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/discovery/model/discovery-service.ts src/testing/country-discovery.test.ts
git commit -m "feat: validate country discovery searches"
```

## Task 4: Expose the server-only discovery route

**Files:**
- Create: `src/app/api/discovery/route.ts`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes `searchCountryCandidates` from Task 3 and `createGooglePlacesProvider` from Task 2.
- `GET /api/discovery?countryCode=TW&countryName=Taiwan&query=night%20market` returns `{ candidates }`.
- Returns `{ error: "Invalid discovery request" }` with 400 for validation errors.
- Returns `{ error: "Live discovery is not configured" }` with 503 when `GOOGLE_MAPS_API_KEY` is absent.
- Returns `{ error: "Discovery provider is unavailable" }` with 502 for `ProviderUnavailableError`.

- [ ] **Step 1: Write the failing route behavior tests**

Add route tests with a small exported `createDiscoveryRouteDependencies` factory so
the handler can receive a fake provider in tests. Assert the 400, 503, and 502
responses above, and assert that successful results serialize as `{ candidates }`.

- [ ] **Step 2: Run the domain test to verify it fails**

Run: `npm run test:domain`

Expected: TypeScript cannot import `src/app/api/discovery/route`.

- [ ] **Step 3: Implement the route and configuration documentation**

Use `NextRequest` and `NextResponse.json`. Read `process.env.GOOGLE_MAPS_API_KEY`
inside the route factory, not from a client module. Create `.env.example` with:

```dotenv
# Server-side only. Obtain an authorized key before enabling live country discovery.
GOOGLE_MAPS_API_KEY=
```

Add a README paragraph explaining that the key enables global place discovery;
it does not enable booking or replace country-specific tourism/offer adapters.

- [ ] **Step 4: Run route and project checks**

Run: `npm run test:domain && npm run typecheck && npm run lint && npm run build`

Expected: all checks pass. Without a key, a manual request returns 503 and no
secret appears in output.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/discovery/route.ts .env.example README.md src/testing/country-discovery.test.ts package.json
git commit -m "feat: expose country discovery route"
```

## Task 5: Document the boundary and Phase 2

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents the discovery foundation's current boundary and the next independent
  implementation plans.

- [ ] **Step 1: Update the README boundary**

In README, state that this foundation returns discovery candidates only. Region
grouping, lodging suggestions, user locks, replan previews, official tourism
adapters, and offer adapters are the next independent implementation plans.

- [ ] **Step 2: Run the full acceptance gate**

Run: `npm run verify:mvp && git diff --check && git status --short`

Expected: all existing tests plus country discovery tests pass; no generated
`.tmp`, `.next`, or `.superpowers` artifact is staged.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: define discovery foundation boundary"
```

## Deferred Independent Plans

After this foundation is merged, write separate plans for these reviewable
deliverables:

1. Selection-driven travel-region grouping, nearby candidates, and
   lodging-area suggestions.
2. User locks, manual itinerary additions, local replan, and preview/apply
   behavior.
3. Country-specific official tourism adapter and one authorized offer-partner
   adapter, each with deterministic mapper fixtures.

## Plan Self-Review

- Spec coverage: Tasks 1-4 cover provider-neutral discovery, evidence,
  country-wide search, server-only access, and partial-provider failure. Task
  5 preserves deterministic execution. The remaining specification areas are
  explicitly decomposed into the three independent plans above.
- Placeholder scan: no task requires an unspecified function or path; live
  credentials are an explicit external prerequisite and no test depends on
  them.
- Type consistency: all later tasks use `DiscoveryCandidate`,
  `CountrySearchInput`, `PlaceSearchProvider`, and `ProviderUnavailableError`
  introduced by earlier tasks.
