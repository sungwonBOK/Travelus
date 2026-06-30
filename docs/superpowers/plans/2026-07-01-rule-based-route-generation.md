# Rule-Based Route Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic loose route generator for the Taipei MVP that turns selected places and bundle courses into `RouteDraft` and `MapCandidate` outputs.

**Architecture:** Add one pure service function to `src/domain/services.ts` and keep it behind the existing domain service boundary. The function will prioritize `must_go` selections and selected bundle courses, place interested selections as map candidates unless they are needed to fill route gaps, and use fixed ordering rules so identical input always returns identical output.

**Tech Stack:** TypeScript, Node built-in test runner, existing `src/domain` model types.

---

### Task 1: Route Generation Contract

**Files:**
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/services.ts`

- [ ] **Step 1: Write the failing test**

Add a test named `route generation prioritizes must-go selections and bundle courses deterministically`. It should call `generateLooseRoutePlan` with `taipeiTrip`, `taipeiPlaces`, `taipeiBundleCourses`, `taipeiUserSelections`, and selected course ids `["yehliu-shifen-jiufen-day", "taipei-night-market-food-route"]`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:domain`
Expected: FAIL because `generateLooseRoutePlan` is not exported yet.

- [ ] **Step 3: Write minimal implementation**

Export `generateLooseRoutePlan` from `src/domain/services.ts` with this request shape:

```ts
export interface LooseRouteGenerationRequest {
  readonly trip: Trip;
  readonly places?: readonly Place[];
  readonly bundleCourses?: readonly BundleCourse[];
  readonly selections?: readonly UserPlaceSelection[];
  readonly selectedBundleCourseIds?: readonly string[];
}
```

Return:

```ts
{
  readonly routeDraft: readonly RouteDraft[];
  readonly mapCandidates: readonly MapCandidate[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:domain`
Expected: PASS for the new test and existing four tests.

### Task 2: Map Candidate Rules

**Files:**
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/services.ts`

- [ ] **Step 1: Write the failing test**

Add a test named `route generation omits excluded places and keeps interested places as map candidates`. It should mark `jiufen-old-street` as excluded and assert it is absent from both route items and map candidates, while `beitou-hot-spring-museum` remains a rainy-day or interest candidate.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:domain`
Expected: FAIL until excluded places are filtered from selected courses and candidate generation.

- [ ] **Step 3: Write minimal implementation**

Filter all excluded place ids before creating route items or map candidates. Convert interested selections that are not included in route items into deterministic `MapCandidate` records with candidate ids in the form `candidate-${tripId}-${placeId}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:domain`
Expected: PASS for all domain tests.

### Task 3: Full Verification

**Files:**
- No additional code files.

- [ ] **Step 1: Run domain tests**

Run: `npm run test:domain`
Expected: all domain tests pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: exit code 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: exit code 0.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: exit code 0.
