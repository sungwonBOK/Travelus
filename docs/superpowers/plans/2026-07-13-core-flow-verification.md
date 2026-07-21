# Core Flow Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stage-identifiable automated smoke test for the Travelus MVP core flow and one local command that runs the complete quality gate.

**Architecture:** Keep production code unchanged. Add one focused `node:test` scenario that drives the existing explorer, workspace, snapshot, and storage boundaries in user order, then wire it into the current TypeScript domain-test runner. Add an npm aggregate script that short-circuits through domain tests, type checking, lint, and the production build.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, strict TypeScript 5, Node built-in `node:test`, npm scripts.

## Global Constraints

- Work only from `D:\Projects\Travelus` on `codex/issue-9-core-flow-verification`.
- Add no production dependency or test framework.
- Change no production behavior or public interface.
- Keep issue #10 README work out of this branch.
- Use fixed Taipei place IDs and a fixed snapshot timestamp.
- Run `test:domain`, `typecheck`, `lint`, and `build` before completion.

---

### Task 1: Add The Stage-Identifiable Core Flow Scenario

**Files:**
- Create: `src/domain/core-flow.test.ts`

**Interfaces:**
- Consumes: `createRecommendationExplorerState()`, `applyRecommendationAction(state, action)`, `createTripWorkspaceView(state)`, `createTripPlanSnapshot(state, savedAt)`, `createTripPlanStorage(options)`, and `restoreRecommendationExplorerState(snapshot)`.
- Produces: one `node:test` parent named `Travelus MVP core flow remains intact` with seven numbered subtests.
- Adds no production export.

- [x] **Step 1: Record the missing aggregate command as RED evidence**

Run:

```powershell
npm run verify:mvp
```

Expected: exit non-zero with `Missing script: "verify:mvp"`. This proves the requested automated entry point does not exist before implementation.

- [x] **Step 2: Write the complete characterization smoke test**

Create `src/domain/core-flow.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRecommendationAction,
  createRecommendationExplorerState,
} from "./recommendation-explorer";
import { createTripPlanStorage } from "./services";
import {
  createTripPlanSnapshot,
  restoreRecommendationExplorerState,
} from "./trip-plan-snapshot";
import { createTripWorkspaceView } from "./trip-workspace";

import type { RecommendationExplorerState } from "./recommendation-explorer";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const keepPlaceIds = ["taipei-101-observatory", "jiufen-old-street"] as const;
const maybePlaceIds = ["beitou-hot-spring-museum", "ximending"] as const;
const hiddenPlaceId = "longshan-temple";

test("Travelus MVP core flow remains intact", async (t) => {
  let state: RecommendationExplorerState = createRecommendationExplorerState();

  await t.test("1. starts the default Taipei trip", () => {
    assert.equal(state.trip.destination.city, "Taipei");
    assert.equal(state.trip.durationDays, 4);
    assert.ok(state.recommendations.length > 0);
  });

  await t.test("2. keeps multiple places", () => {
    for (const placeId of keepPlaceIds) {
      state = applyRecommendationAction(state, { placeId, action: "keep" });
    }

    assert.deepEqual(
      state.selections
        .filter((selection) => selection.selectionType === "must_go")
        .map((selection) => selection.placeId),
      [...keepPlaceIds],
    );
  });

  await t.test("3. marks multiple places as interested", () => {
    for (const placeId of maybePlaceIds) {
      state = applyRecommendationAction(state, { placeId, action: "maybe" });
    }

    assert.deepEqual(
      state.selections
        .filter((selection) => selection.selectionType === "interested")
        .map((selection) => selection.placeId),
      [...maybePlaceIds],
    );
  });

  await t.test("4. excludes one place", () => {
    state = applyRecommendationAction(state, {
      placeId: hiddenPlaceId,
      action: "hide",
    });

    assert.equal(
      state.selections.find(
        (selection) => selection.placeId === hiddenPlaceId,
      )?.selectionType,
      "excluded",
    );
    assert.equal(
      state.recommendations.some((place) => place.placeId === hiddenPlaceId),
      false,
    );
  });

  await t.test("5. generates a route from kept places", () => {
    const workspace = createTripWorkspaceView(state);
    const routePlaceIds = workspace.routeItems.flatMap((item) =>
      item.placeId ? [item.placeId] : [],
    );

    for (const placeId of keepPlaceIds) {
      assert.ok(routePlaceIds.includes(placeId));
    }
    assert.equal(routePlaceIds.includes(hiddenPlaceId), false);
  });

  await t.test("6. exposes map candidates for interested places", () => {
    const workspace = createTripWorkspaceView(state);
    const candidatePlaceIds = workspace.mapCandidates.map(
      (candidate) => candidate.placeId,
    );

    for (const placeId of maybePlaceIds) {
      assert.ok(candidatePlaceIds.includes(placeId));
    }
    assert.equal(candidatePlaceIds.includes(hiddenPlaceId), false);
    assert.ok(workspace.mapPins.length > 0);
    assert.ok(
      workspace.mapPins.every(
        (pin) =>
          Number.isFinite(pin.coordinates.lat) &&
          Number.isFinite(pin.coordinates.lng),
      ),
    );
  });

  await t.test("7. saves, loads, and restores the complete snapshot", () => {
    const storage = createTripPlanStorage({
      key: "travelus:test:core-flow",
      storage: new MemoryStorage(),
    });
    const snapshot = createTripPlanSnapshot(
      state,
      "2026-07-13T00:00:00.000Z",
    );
    storage.save(snapshot);

    const loaded = storage.load();
    assert.ok(loaded);
    assert.equal(loaded.schemaVersion, 1);
    assert.deepEqual(loaded.userSelections, state.selections);

    const restored = restoreRecommendationExplorerState(loaded);
    assert.deepEqual(restored.trip, state.trip);
    assert.deepEqual(restored.selections, state.selections);
    assert.equal(
      restored.recommendations.some(
        (place) => place.placeId === hiddenPlaceId,
      ),
      false,
    );
    assert.ok(snapshot.routeDraft.length > 0);
    assert.ok(snapshot.mapCandidates.length > 0);
  });
});
```

- [x] **Step 3: Compile and run the new characterization test directly**

Run:

```powershell
npx tsc -p tsconfig.domain-test.json
node --test .tmp/domain-tests/src/domain/core-flow.test.js
```

Expected: the seven numbered subtests and parent test pass. This is an approved characterization-test exception: existing production behavior is being connected and recorded, so no intentionally false domain assertion is introduced to manufacture a RED failure.

- [x] **Step 4: Prove the existing canonical runner does not include the scenario**

Run:

```powershell
npm run test:domain
```

Expected: exit 0 with the existing 16 tests only and no `Travelus MVP core flow remains intact` output. This is the missing-runner portion of the RED evidence.

### Task 2: Register The Smoke Test And Aggregate Quality Gate

**Files:**
- Modify: `package.json`

**Interfaces:**
- Changes: `test:domain` runs both compiled test files explicitly.
- Produces: `verify:mvp` running `test:domain`, `typecheck`, `lint`, and `build` in order.
- Preserves: all dependency and devDependency entries exactly.

- [x] **Step 1: Add the minimum npm script wiring**

Change the `scripts` block in `package.json` to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test:domain": "tsc -p tsconfig.domain-test.json && node --test .tmp/domain-tests/src/domain/services.test.js .tmp/domain-tests/src/domain/core-flow.test.js",
  "verify:mvp": "npm run test:domain && npm run typecheck && npm run lint && npm run build"
}
```

- [x] **Step 2: Verify GREEN through the canonical domain runner**

Run:

```powershell
npm run test:domain
```

Expected: exit 0 with all 24 tests passing, including the seven numbered core-flow subtests and their parent.

- [x] **Step 3: Verify the aggregate command**

Run:

```powershell
npm run verify:mvp
```

Expected: exit 0 after `test:domain`, `typecheck`, `lint`, and the Next.js production build all succeed in that order.

### Task 3: Final Audit And Publishable Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-13-core-flow-verification.md` only to check completed steps.
- Verify: `docs/superpowers/specs/2026-07-13-core-flow-verification-design.md`, `package.json`, and `src/domain/core-flow.test.ts`.

**Interfaces:**
- Produces: one verified implementation commit on `codex/issue-9-core-flow-verification`.
- Preserves: issue #10 scope and all package dependency declarations.

- [x] **Step 1: Run every required command freshly and separately**

Run:

```powershell
npm run test:domain
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0; domain output reports 24 passing tests with zero failures, and Next.js 16.2.9 completes the production build.

- [x] **Step 2: Audit requirements and diff scope**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat HEAD
git diff -- package.json package-lock.json
git diff -- src/domain/core-flow.test.ts
```

Expected: no whitespace errors, no `package-lock.json` or dependency changes, and only the approved test, npm scripts, spec status, and plan progress appear.

- [x] **Step 3: Commit the implementation**

Run:

```powershell
git add -- docs/superpowers/specs/2026-07-13-core-flow-verification-design.md docs/superpowers/plans/2026-07-13-core-flow-verification.md src/domain/core-flow.test.ts package.json
git commit -m "test: verify Travelus MVP core flow"
```

- [x] **Step 4: Push and open the draft PR authorized by the session goal**

Create `C:\tmp\travelus-issue-9-pr-body.md` with:

```markdown
## Summary

- add a seven-stage Travelus MVP core-flow smoke test
- report the broken stage through named `node:test` subtests
- add `verify:mvp` for domain tests, typecheck, lint, and build

## Verification

- [x] `npm run test:domain`
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`

No dependency was added.

Closes #9
```

Then run:

```powershell
git push -u origin codex/issue-9-core-flow-verification
gh pr create --repo sungwonBOK/Travelus --base main --head codex/issue-9-core-flow-verification --draft --title "test: Travelus MVP 핵심 플로우 검증 추가" --body-file "C:\tmp\travelus-issue-9-pr-body.md"
```

The PR body must summarize the named smoke stages and `verify:mvp`, list the four fresh verification commands, state that no dependency was added, and include `Closes #9`. Expected: a draft PR URL; issue #9 remains open until the PR is merged.
