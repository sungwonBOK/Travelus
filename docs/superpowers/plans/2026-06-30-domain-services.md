# Domain Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #3 service boundaries for recommendations, place selection state, and versioned local snapshot storage.

**Architecture:** Keep pure domain logic in `src/domain/services.ts`, backed by existing Taipei sample data and domain types. Add a dependency-injected storage adapter so localStorage can be replaced later without changing UI callers.

**Tech Stack:** TypeScript strict mode, Node built-in `node:test`, `npm run test:domain`, `npm run typecheck`, `npm run lint`, `npm run build`.

---

### Task 1: Domain Test Harness

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `tsconfig.domain-test.json`

- [ ] Add a `test:domain` script that compiles domain files into `.tmp/domain-tests` and runs Node's built-in test runner.
- [ ] Ignore `.tmp/` generated test output.

### Task 2: Service Behavior Tests

**Files:**
- Create: `src/domain/services.test.ts`

- [ ] Write failing tests for recommendation filtering/sorting, keep/maybe/hide selection transitions, route candidate exclusion, and versioned snapshot storage.
- [ ] Run `npm run test:domain`; expected result is failure because `src/domain/services.ts` does not exist.

### Task 3: Service Implementation

**Files:**
- Create: `src/domain/services.ts`
- Modify: `src/domain/index.ts`

- [ ] Implement `getRecommendedPlaces`, `applyPlaceSelection`, `getRouteEligibleSelections`, and `createTripPlanStorage`.
- [ ] Export services from the domain entrypoint.
- [ ] Run `npm run test:domain`; expected result is pass.

### Task 4: Verification And Publish

**Files:**
- All changed files

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit, push, and open a draft PR with `Closes #3`.
