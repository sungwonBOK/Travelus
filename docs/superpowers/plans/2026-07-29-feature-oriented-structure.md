# Feature-Oriented Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Travelus from flat `app` and `domain` folders to the approved feature-oriented hybrid structure without changing runtime behavior, snapshot schema, dependencies, or the mock-map boundary.

**Architecture:** Keep `app` limited to App Router composition. Place stable trip and place concepts in `entities`, runtime Taipei seed data in `demo/taipei`, cross-feature tests in `testing`, and implementation code under the capabilities that own it: recommendations, itinerary, map, and trip-plan.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node built-in `node:test`; no dependency changes.

## Global Constraints

- Work only in `D:\Projects\Travelus` on `codex/project-structure-proposal`.
- Preserve UI behavior, localStorage snapshot schema, public route `/`, and `test:domain` command name.
- Add no dependency or empty architectural layer.
- Use `demo/taipei` for the MVP's runtime seed data; production code must not import from `testing`.
- Keep cross-feature test coverage deterministic and run the full quality gate before completion.

---

### Task 1: Establish the Destination Boundaries

**Files:**
- Modify: `PROJECT_STRUCTURE.md`
- Create: `src/entities/trip/model/types.ts`
- Create: `src/entities/place/model/types.ts`
- Create: `src/features/recommendations/model/types.ts`
- Create: `src/features/itinerary/model/types.ts`
- Create: `src/features/map/model/types.ts`
- Create: `src/features/trip-plan/model/types.ts`

**Interfaces:**
- `entities/trip/model/types.ts` owns `DestinationId`, `TravelStyle`, `AccommodationStatus`, `Destination`, and `Trip`.
- `entities/place/model/types.ts` owns place metadata and `Place`.
- Feature type files own selection, itinerary, map, and snapshot DTOs respectively.

- [ ] Copy the existing type declarations into their owner files without changing property names or union members.
- [ ] Run `npm run typecheck`; it must fail until moved module imports are updated, proving no old flat module is silently masking the move.
- [ ] Update every affected import to the destination type owner and run `npm run typecheck` until it passes.

### Task 2: Move Runtime Models by Feature

**Files:**
- Create: `src/demo/taipei/sample-data.ts`
- Create: `src/features/recommendations/model/recommendation-explorer.ts`
- Create: `src/features/recommendations/model/recommendation-service.ts`
- Create: `src/features/itinerary/model/route-generator.ts`
- Create: `src/features/itinerary/model/trip-workspace.ts`
- Create: `src/features/map/model/map-projection.ts`
- Create: `src/features/trip-plan/model/snapshot.ts`
- Create: `src/features/trip-plan/model/storage.ts`
- Delete after imports move: the corresponding `src/domain/*.ts` files.

**Interfaces:**
- Preserve exported function names and parameters from the existing domain modules.
- `trip-plan/model/snapshot.ts` may compose recommendation and itinerary models.
- No entity imports from a feature are allowed.

- [ ] Move each model with the same implementation first; change only import paths needed for its new owner.
- [ ] Keep the sample data imports in runtime models pointing to `demo/taipei/sample-data.ts`.
- [ ] Run `npm run test:domain` after the model move; all existing 24 tests must still pass.

### Task 3: Move UI and Test Ownership

**Files:**
- Create: `src/features/recommendations/ui/recommendation-explorer.tsx`
- Create: `src/features/itinerary/ui/trip-workspace.tsx`
- Create: `src/features/map/ui/mock-map-panel.tsx`
- Create: `src/features/map/ui/mock-map-position.ts`
- Create: `src/testing/domain-integration.test.ts`
- Create: `src/testing/core-flow.test.ts`
- Create: `src/testing/taipei-sample-data.test.ts`
- Modify: `src/app/page.tsx`, `package.json`, `tsconfig.domain-test.json`
- Delete after imports move: old `src/app` feature files and old `src/domain` tests.

**Interfaces:**
- `src/app/page.tsx` imports only `RecommendationExplorer` from the recommendations UI.
- `test:domain` compiles and runs the three relocated test files explicitly.

- [ ] Move UI files unchanged, then change local and alias imports to feature owners.
- [ ] Move tests unchanged, then update their imports to the new entity, feature, and demo paths.
- [ ] Update the explicit test runner paths only after the relocated test files exist.
- [ ] Run `npm run test:domain`; it must report the same 24 passing tests and the named core-flow stages.

### Task 4: Remove the Flat Compatibility Surface and Verify

**Files:**
- Delete: `src/domain/index.ts`, `src/domain/types.ts`, `src/domain/services.ts`, and all remaining migrated `src/domain` files.
- Verify: `PROJECT_STRUCTURE.md`, `src/app`, `src/entities`, `src/features`, `src/demo`, and `src/testing`.

- [ ] Search with `rg -n '(@/domain|src/domain|\.\/domain)' src package.json tsconfig.domain-test.json`; expected: no matches.
- [ ] Run `npm run test:domain`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Review `git diff --check`, `git diff --stat HEAD`, and the dependency sections of `package.json` before committing.
