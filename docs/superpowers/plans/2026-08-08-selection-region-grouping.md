# Selection Region Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a traveler's country-wide Keep/Maybe selections into deterministic travel-region groups with nearby candidate and lodging-area suggestions, without changing the current Taipei trip flow.

**Architecture:** Add a pure `region-suggestions` feature model that receives normalized discovery candidates, traveler selections, editorial candidate-to-region assignments, and lodging-area records. It returns a region workspace projection; no UI, route mutation, provider call, or snapshot-schema change occurs in this slice. Taiwan demo data proves the country-first behavior without requiring a live API key.

**Tech Stack:** TypeScript 5, Node built-in test runner, existing Next.js project, no new dependencies.

## Global Constraints

- Work only in `D:\Projects\Travelus`.
- Add no production dependency and make no live provider call in automated tests.
- Keep the existing Taipei demo, snapshot schema, `/` behavior, and `test:domain` script name intact.
- Treat a candidate assignment as editable local product data; do not infer a region from a provider payload in this slice.
- Keep `keep` and `maybe` selections; exclude `hide` selections from all group, nearby, and lodging outputs.
- Do not generate or overwrite an itinerary. User locks and replan previews are a later independent plan.

---

## File Structure

- `src/features/region-suggestions/model/types.ts`: selection, assignment, lodging, and region-workspace contracts.
- `src/features/region-suggestions/model/region-suggestion-service.ts`: pure grouping and deterministic recommendations.
- `src/demo/taiwan/region-suggestion-data.ts`: Taiwan country-wide fixture owned by the demo boundary.
- `src/testing/region-suggestions.test.ts`: deterministic behavior tests.
- `package.json`: explicitly executes the compiled region-suggestion test.
- `README.md`: documents that regional suggestions are proposal data, not an automatic itinerary.

## Task 1: Define region-suggestion contracts and Taiwan fixture

**Files:**
- Create: `src/features/region-suggestions/model/types.ts`
- Create: `src/demo/taiwan/region-suggestion-data.ts`
- Create: `src/testing/region-suggestions.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes `DiscoveryCandidate` and `TravelRegion` from `features/discovery/model/types`.
- Produces `CountryCandidateSelection`, `CandidateRegionAssignment`, `LodgingAreaSuggestion`, and `RegionSuggestionWorkspace` for Task 2.

- [ ] **Step 1: Write the failing contract and fixture test**

```ts
import {
  taiwanCandidateAssignments,
  taiwanDiscoveryCandidates,
  taiwanLodgingAreas,
  taiwanTravelRegions,
} from "../demo/taiwan/region-suggestion-data";

assert.equal(taiwanTravelRegions.length, 3);
assert.equal(taiwanDiscoveryCandidates.length, 6);
assert.equal(taiwanCandidateAssignments.length, taiwanDiscoveryCandidates.length);
assert.equal(taiwanLodgingAreas[0]?.regionId, "taipei");
```

- [ ] **Step 2: Run the domain suite to verify it fails**

Run: `npm run test:domain`

Expected: TypeScript reports that `../demo/taiwan/region-suggestion-data` does not exist.

- [ ] **Step 3: Add the contracts, fixture, and test runner entry**

```ts
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
```

Define `RegionSuggestionGroup` with `region`, `keptCandidates`, `maybeCandidates`, `nearbyCandidates`, and `lodgingAreas`. Define `RegionSuggestionWorkspace` with `groups` and `unassignedCandidates`.

Create six Taiwan candidates assigned to Taipei, Hualien, and Tainan. Include a broad `travel_area` candidate named `Taroko Gorge`, a `travel_area` candidate named `Shilin Night Market`, and lodging records for each region. Change only the existing `test:domain` command by adding `.tmp/domain-tests/src/testing/region-suggestions.test.js` to its `node --test` argument list.

- [ ] **Step 4: Run the domain suite to verify it passes**

Run: `npm run test:domain`

Expected: existing tests pass and the Taiwan fixture contract test runs.

- [ ] **Step 5: Commit**

```bash
git add package.json src/features/region-suggestions/model/types.ts src/demo/taiwan/region-suggestion-data.ts src/testing/region-suggestions.test.ts
git commit -m "feat: define region suggestion records"
```

## Task 2: Group selected candidates without requiring a region choice

**Files:**
- Create: `src/features/region-suggestions/model/region-suggestion-service.ts`
- Modify: `src/testing/region-suggestions.test.ts`

**Interfaces:**
- Consumes `DiscoveryCandidate[]`, `TravelRegion[]`, `CandidateRegionAssignment[]`, and `CountryCandidateSelection[]`.
- Produces `createRegionSuggestionWorkspace(input): RegionSuggestionWorkspace`.

- [ ] **Step 1: Write the failing grouping tests**

```ts
const workspace = createRegionSuggestionWorkspace({
  candidates: taiwanDiscoveryCandidates,
  regions: taiwanTravelRegions,
  assignments: taiwanCandidateAssignments,
  lodgingAreas: taiwanLodgingAreas,
  selections: [
    { candidateId: "taipei-night-market", selectionType: "keep" },
    { candidateId: "hualien-taroko", selectionType: "keep" },
    { candidateId: "tainan-flowers-night-market", selectionType: "maybe" },
  ],
});

assert.deepEqual(workspace.groups.map((group) => group.region.regionId), [
  "hualien", "taipei", "tainan",
]);
assert.deepEqual(workspace.groups[0]?.keptCandidates.map((candidate) => candidate.candidateId), ["hualien-taroko"]);
assert.deepEqual(workspace.groups[2]?.maybeCandidates.map((candidate) => candidate.candidateId), ["tainan-flowers-night-market"]);
```

Add a second test with an assigned `hide` selection and an unassigned kept candidate. Assert the hidden candidate is absent from every group and the unassigned kept candidate is returned in `unassignedCandidates`.

- [ ] **Step 2: Run the domain suite to verify it fails**

Run: `npm run test:domain`

Expected: TypeScript reports that `region-suggestion-service` does not exist.

- [ ] **Step 3: Implement the pure grouping service**

```ts
export function createRegionSuggestionWorkspace(input: RegionSuggestionInput): RegionSuggestionWorkspace {
  // Index candidates and assignments by id.
  // Ignore `hide`; group keep/maybe candidates by assigned region.
  // Return unknown assigned IDs and candidates with no assignment as unassigned.
  // Sort groups by kept count descending, then maybe count descending, then regionId ascending.
}
```

Do not mutate input arrays. Ignore duplicate selection records after the first occurrence for a candidate ID. Ignore assignments for unknown regions rather than inventing a region.

- [ ] **Step 4: Run the domain suite to verify it passes**

Run: `npm run test:domain`

Expected: Taiwan selections are grouped without the traveler selecting a region first; hidden and unassigned behavior passes.

- [ ] **Step 5: Commit**

```bash
git add src/features/region-suggestions/model/region-suggestion-service.ts src/testing/region-suggestions.test.ts
git commit -m "feat: group country selections by travel region"
```

## Task 3: Suggest nearby candidates and lodging areas per selected region

**Files:**
- Modify: `src/features/region-suggestions/model/region-suggestion-service.ts`
- Modify: `src/testing/region-suggestions.test.ts`

**Interfaces:**
- Extends the Task 2 workspace groups.
- `nearbyCandidates` contains at most two unselected, non-hidden candidates from the same region in original candidate order.
- `lodgingAreas` contains every fixture lodging area for the group region in input order.

- [ ] **Step 1: Write the failing recommendation tests**

```ts
const taipeiGroup = workspace.groups.find((group) => group.region.regionId === "taipei");
assert.deepEqual(taipeiGroup?.nearbyCandidates.map((candidate) => candidate.candidateId), [
  "taipei-national-palace-museum",
]);
assert.deepEqual(taipeiGroup?.lodgingAreas.map((area) => area.lodgingAreaId), [
  "taipei-main-station",
]);
```

Add a hidden `taipei-national-palace-museum` selection to the input and assert it is not proposed as nearby. Add three unselected candidates in one test-only region and assert only the first two are returned.

- [ ] **Step 2: Run the domain suite to verify it fails**

Run: `npm run test:domain`

Expected: grouping passes but nearby and lodging assertions fail because outputs are empty.

- [ ] **Step 3: Extend the service with deterministic proposals**

For each selected group, filter candidates by its `regionId`; exclude all selected IDs and all hidden IDs; preserve candidate input order; keep the first two as `nearbyCandidates`. Filter lodging areas by `regionId` and preserve input order. Do not select a lodging area or alter any trip.

- [ ] **Step 4: Run the domain suite to verify it passes**

Run: `npm run test:domain`

Expected: nearby candidates and lodging areas are proposals only and hidden candidates never reappear.

- [ ] **Step 5: Commit**

```bash
git add src/features/region-suggestions/model/region-suggestion-service.ts src/testing/region-suggestions.test.ts
git commit -m "feat: suggest nearby places and lodging areas"
```

## Task 4: Document the proposal boundary and run acceptance checks

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents that regional groups, nearby results, and lodging areas are editable proposals.
- States that itinerary generation, locks, and preview/apply replanning remain later work.

- [ ] **Step 1: Update the README**

Add a concise country-planning paragraph: selections can be grouped by travel region and receive nearby/lodging suggestions; these outputs do not modify a saved route or accommodation choice. State that user locks and preview-before-apply replanning remain the next plan.

- [ ] **Step 2: Run full acceptance**

Run: `npm run verify:mvp && git diff --check && git status --short`

Expected: all existing and region-suggestion tests pass; no `.tmp`, `.next`, `.superpowers`, or `.worktrees` content is staged.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: define regional suggestion boundary"
```

## Plan Self-Review

- Spec coverage: Tasks 1-3 implement country-wide selected-candidate grouping, broad areas as candidates, nearby suggestions, and lodging-area proposals. Task 4 preserves the boundary that itinerary generation and locks are later work.
- Placeholder scan: every task names files, interfaces, test cases, ordering, and acceptance commands; no live provider, unspecified distance API, or unchosen booking partner is required.
- Type consistency: Tasks 2-3 consume the Task 1 contracts; `createRegionSuggestionWorkspace` is the only service entry point and returns the Task 1 workspace/group types.
