# Trip Snapshot Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and restore the current Travelus plan as a versioned `TripPlanSnapshot` in browser `localStorage`.

**Architecture:** Keep serialization and restoration in pure domain functions built on the existing replaceable storage adapter. Extend the explorer state only with the snapshot fields that already belong to the approved domain model, then keep the React component responsible solely for connecting that tested boundary to `window.localStorage` after hydration.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Node built-in test runner, existing `TripPlanStorageAdapter`.

## Global Constraints

- Work only from `D:\Projects\Travelus`.
- Add no production dependency.
- Preserve the existing recommendation and workspace behavior.
- Use RED-GREEN-REFACTOR and run `test:domain`, `typecheck`, `lint`, and `build` before completion.

---

### Task 1: Snapshot Mapping and Restoration

**Files:**
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/recommendation-explorer.ts`
- Create: `src/domain/trip-plan-snapshot.ts`
- Modify: `src/domain/index.ts`

**Interfaces:**
- Produces: `createTripPlanSnapshot(state, savedAt): TripPlanSnapshot`
- Produces: `restoreRecommendationExplorerState(snapshot): RecommendationExplorerState`

- [x] **Step 1: Write the failing round-trip test**

Create a customized explorer state, turn it into a snapshot with a fixed ISO timestamp, persist it through `createTripPlanStorage`, load it, and restore it. Assert trip setup, keep/maybe/hide selections, selected bundle IDs, accommodation choice, route draft, map candidates, `schemaVersion`, and `savedAt`.

- [x] **Step 2: Run RED**

Run: `npm run test:domain`

Expected: FAIL because the snapshot mapping exports and explorer snapshot fields do not exist.

- [x] **Step 3: Implement the minimum domain mapping**

Add `selectedBundleCourseIds` and `accommodationChoice` to `RecommendationExplorerState`, initializing them without changing the currently rendered route. Build snapshot route/map output through the existing workspace projection and reconstruct recommendations with `getRecommendedPlaces` during restore.

- [x] **Step 4: Run GREEN**

Run: `npm run test:domain`

Expected: all domain tests pass.

### Task 2: Reject Incomplete Stored Snapshots

**Files:**
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/services.ts`

**Interfaces:**
- Preserves: `TripPlanStorage.load(): TripPlanSnapshot | null`

- [x] **Step 1: Write a failing boundary test**

Store a schema-version-1 JSON object that omits required arrays and metadata, then assert `load()` returns `null`.

- [x] **Step 2: Run RED**

Run: `npm run test:domain`

Expected: FAIL because the current loader accepts any version-1 object with a `trip` field.

- [x] **Step 3: Add explicit shape checks**

Validate the required top-level strings, objects, and arrays before returning the parsed snapshot. Keep unsupported, malformed, or incomplete values non-throwing and return `null`.

- [x] **Step 4: Run GREEN**

Run: `npm run test:domain`

Expected: all domain tests pass.

### Task 3: Browser localStorage Wiring

**Files:**
- Modify: `src/app/recommendation-explorer.tsx`

**Interfaces:**
- Consumes: `createTripPlanStorage`, `createTripPlanSnapshot`, and `restoreRecommendationExplorerState`

- [x] **Step 1: Connect the tested boundary after hydration**

On mount, create the existing storage service with `window.localStorage`, load once, and restore a valid snapshot. Persist each subsequent explorer state update through the same service with a fresh ISO save timestamp. A restored plan should enter the recommendation flow without changing workspace navigation state.

- [x] **Step 2: Run focused checks**

Run: `npm run test:domain` and `npm run typecheck`.

Expected: both commands pass.

- [x] **Step 3: Run complete verification**

Run: `npm run test:domain`, `npm run typecheck`, `npm run lint`, and `npm run build`.

Expected: all commands exit 0.

- [x] **Step 4: Review scope**

Run: `git diff --check`, inspect `git diff --stat`, verify `package.json` production dependencies did not change, and confirm the branch is `codex/issue-8-trip-snapshot-storage`.
