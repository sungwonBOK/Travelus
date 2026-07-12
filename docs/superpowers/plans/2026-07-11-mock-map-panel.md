# Mock Map Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render replaceable mock-map pins for the main route, interested places, nearby suggestions, and rainy-day alternatives using the Taipei sample coordinates.

**Architecture:** A pure domain projection converts route and candidate records into renderer-neutral pins that retain geographic coordinates. `TripWorkspace` supplies current route and interest candidates plus the curated nearby/rainy sample candidates, while a focused `MockMapPanel` owns only the temporary CSS positioning and presentation.

**Tech Stack:** TypeScript, React 19, Next.js 16, Tailwind CSS, Node test runner

## Global Constraints

- Follow the repository `AGENTS.md`.
- Add no production or development dependency.
- Keep real map APIs, persistence, auth, and unrelated workspace behavior out of scope.
- Preserve raw sample coordinates so the mock renderer can be replaced later.

---

### Task 1: Renderer-neutral map projection

**Files:**
- Create: `src/domain/map-projection.ts`
- Modify: `src/domain/index.ts`
- Test: `src/domain/services.test.ts`

**Interfaces:**
- Consumes: `RouteDraft`, `MapCandidate`, `Place`, and `BundleCourse` sample-domain records.
- Produces: `createMapPins(input): readonly MapPin[]`, where each pin has `pinId`, `kind`, `placeId`, `label`, `coordinates`, `description`, and optional `routeOrder`.

- [x] **Step 1: Write the failing projection test**

  Add a test that passes Taipei route items, the interest/nearby/rainy sample candidates, places, and bundle courses to `createMapPins`. Assert that all four semantic kinds are emitted, route order is stable, and every output pin retains the referenced place coordinates.

- [x] **Step 2: Run the focused domain suite and verify RED**

  Run: `npm run test:domain`

  Expected: compilation fails because `createMapPins` and `map-projection.ts` do not exist.

- [x] **Step 3: Implement the minimum projection**

  Resolve place routes directly and bundle routes through the course's first included place. Convert `nearby` and `rainy_day` candidates to their matching semantic kind and all other candidate types to `interest`; skip unresolved references and deduplicate repeated candidate kinds for the same place.

- [x] **Step 4: Run the focused domain suite and verify GREEN**

  Run: `npm run test:domain`

  Expected: all domain tests pass.

### Task 2: Workspace candidate composition

**Files:**
- Modify: `src/domain/trip-workspace.ts`
- Test: `src/domain/services.test.ts`

**Interfaces:**
- Consumes: the generated route plan, current selections, and curated Taipei `nearby`/`rainy_day` candidates.
- Produces: `TripWorkspaceView.mapPins`, ready for any renderer.

- [x] **Step 1: Write the failing workspace test**

  Extend the workspace behavior test so a kept route place and an interested place produce route and interest pins, while non-excluded curated data supplies nearby and rainy-day pins. Assert that every pin has finite `lat` and `lng` values.

- [x] **Step 2: Run the focused domain suite and verify RED**

  Run: `npm run test:domain`

  Expected: the new `mapPins` assertions fail because the view has no projection yet.

- [x] **Step 3: Implement the minimum workspace composition**

  Merge generated interest candidates with curated nearby/rainy candidates, excluding places that the user hid and avoiding exact duplicates. Call `createMapPins` with the current route and Taipei sample lookup data.

- [x] **Step 4: Run the focused domain suite and verify GREEN**

  Run: `npm run test:domain`

  Expected: all domain tests pass.

### Task 3: Replaceable mock renderer

**Files:**
- Create: `src/app/mock-map-panel.tsx`
- Modify: `src/app/trip-workspace.tsx`

**Interfaces:**
- Consumes: `readonly MapPin[]` through `MockMapPanel({ pins })`.
- Produces: a coordinate-positioned mock surface, four-kind legend, pin counts, and accessible pin labels without domain transformation logic.

- [x] **Step 1: Implement the renderer boundary**

  Normalize the provided latitude/longitude range into padded CSS percentages inside `MockMapPanel`, render numbered dark route pins and distinct interest, nearby, and rainy-day pins, and show an empty state when no pins exist.

- [x] **Step 2: Connect the Map tab**

  Replace the inline map chips in `TripWorkspace` with `<MockMapPanel pins={workspace.mapPins} />`. Keep candidate notes based on the projected pins and remove imports/constants made obsolete by the extraction.

- [x] **Step 3: Run static verification**

  Run: `npm run typecheck` and `npm run lint`

  Expected: both commands exit successfully with no errors.

### Task 4: Full verification

**Files:**
- Review: all changed files

**Interfaces:**
- Consumes: completed issue #7 slice.
- Produces: evidence that the branch is safe to hand off.

- [x] **Step 1: Run all project checks**

  Run: `npm run test:domain`, `npm run typecheck`, `npm run lint`, and `npm run build`.

  Expected: all commands exit successfully; if font fetching is sandbox-blocked, rerun the unchanged build with network permission.

- [x] **Step 2: Review scope and dependency drift**

  Run: `git status --short`, `git diff --check`, `git diff --stat`, and `git diff -- package.json package-lock.json`.

  Expected: only issue #7 source, tests, and this plan changed; dependency manifests are unchanged.
