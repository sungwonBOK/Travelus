# Recoverable Hidden Places Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users recover places after pressing Hide without changing existing excluded-place route rules or the versioned localStorage schema.

**Architecture:** Keep `excluded` as the single persisted hidden state. Add pure explorer-domain helpers for deriving hidden places and restoring an undecided place, then render a thin native disclosure section in the existing recommendation UI. Reuse the current snapshot save path for every recovery action.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Node built-in `node:test`, existing `TripPlanSnapshot` storage adapter.

## Global Constraints

- Work only from `D:\Projects\Travelus`.
- Add no dependency.
- Do not change the `TripPlanSnapshot` schema or `SelectionType` union.
- Keep excluded places outside Plan, Map, and Saved until the user restores or promotes them.
- Use RED-GREEN-REFACTOR and run `test:domain`, `typecheck`, `lint`, and `build` before completion.

---

### Task 1: Hidden Recommendation Domain Flow

**Files:**
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/recommendation-explorer.ts`

**Interfaces:**
- Extends: `RecommendationAction` with `"restore"`
- Produces: `getHiddenRecommendations(state: RecommendationExplorerState): Place[]`
- Preserves: existing `applyRecommendationAction(state, action): RecommendationExplorerState`

- [x] **Step 1: Write failing hide and restore tests**

Add `getHiddenRecommendations` to the explorer imports in `src/domain/services.test.ts`, then add these tests:

```ts
test("hidden recommendations remain recoverable", () => {
  let state = createRecommendationExplorerState();

  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "hide",
  });

  assert.equal(
    state.recommendations.some((place) => place.placeId === "longshan-temple"),
    false,
  );
  assert.deepEqual(
    getHiddenRecommendations(state).map((place) => place.placeId),
    ["longshan-temple"],
  );

  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "restore",
  });

  assert.equal(
    state.selections.some((selection) => selection.placeId === "longshan-temple"),
    false,
  );
  assert.equal(
    state.recommendations.some((place) => place.placeId === "longshan-temple"),
    true,
  );
  assert.deepEqual(getHiddenRecommendations(state), []);
});

test("hidden recommendations can be promoted without duplicate selections", () => {
  let state = applyRecommendationAction(createRecommendationExplorerState(), {
    placeId: "longshan-temple",
    action: "hide",
  });

  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "keep",
  });

  assert.equal(
    state.selections.filter((selection) => selection.placeId === "longshan-temple").length,
    1,
  );
  assert.equal(
    state.selections.find((selection) => selection.placeId === "longshan-temple")
      ?.selectionType,
    "must_go",
  );
  assert.deepEqual(getHiddenRecommendations(state), []);
});
```

- [x] **Step 2: Run RED**

Run: `npm run test:domain`

Expected: TypeScript compilation fails because `getHiddenRecommendations` and the `restore` action do not exist.

- [x] **Step 3: Implement the minimum domain behavior**

In `src/domain/recommendation-explorer.ts`, change the action type and add the hidden projection:

```ts
export type RecommendationAction = "keep" | "maybe" | "hide" | "restore";

const selectionTypeByAction: Record<
  Exclude<RecommendationAction, "restore">,
  SelectionType
> = {
  keep: "must_go",
  maybe: "interested",
  hide: "excluded",
};

export function getHiddenRecommendations(
  state: RecommendationExplorerState,
): Place[] {
  const hiddenPlaceIds = new Set(
    state.selections
      .filter((selection) => selection.selectionType === "excluded")
      .map((selection) => selection.placeId),
  );

  return taipeiPlaces.filter((place) => hiddenPlaceIds.has(place.placeId));
}
```

At the start of `applyRecommendationAction`, branch only for restore and reuse the existing recommendation sorter:

```ts
  if (action.action === "restore") {
    const selections = state.selections.filter(
      (selection) =>
        !(
          selection.tripId === state.trip.tripId &&
          selection.placeId === action.placeId
        ),
    );

    return {
      ...state,
      selections,
      recommendations: getRecommendedPlaces({
        trip: state.trip,
        places: taipeiPlaces,
        selections,
      }),
    };
  }
```

The existing non-restore branch continues to call `applyPlaceSelection`, so Keep and Maybe update the same selection instead of creating duplicates.

- [x] **Step 4: Verify GREEN**

Run: `npm run test:domain`

Expected: all domain tests pass, including both new recovery tests.

- [x] **Step 5: Extend snapshot recovery coverage**

In the existing `trip plan snapshots round-trip the complete editable plan` test, assert that the restored excluded place is still exposed by the hidden projection:

```ts
  assert.deepEqual(
    getHiddenRecommendations(restored).map((place) => place.placeId),
    ["longshan-temple"],
  );
```

Run: `npm run test:domain`

Expected: all tests pass and the snapshot round-trip proves the hidden drawer can be recreated after refresh.

### Task 2: Collapsible Hidden Places UI

**Files:**
- Modify: `src/app/recommendation-explorer.tsx`

**Interfaces:**
- Consumes: `getHiddenRecommendations(state)`
- Sends: existing `updateState` calls with `restore`, `keep`, or `maybe`

- [x] **Step 1: Derive the hidden list**

Import `getHiddenRecommendations` from `@/domain` and add this beside the existing Keep/Maybe counts:

```ts
  const hiddenPlaces = getHiddenRecommendations(state);
```

- [x] **Step 2: Render the accessible disclosure section**

Immediately after the main recommendation-card grid, render this section only when `hiddenPlaces.length > 0`:

```tsx
{hiddenPlaces.length > 0 ? (
  <details className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4 sm:p-5">
    <summary className="cursor-pointer text-sm font-semibold text-[#685f52]">
      숨긴 장소 {hiddenPlaces.length}
    </summary>
    <div className="mt-4 space-y-3">
      {hiddenPlaces.map((place) => (
        <article
          key={place.placeId}
          className="rounded-xl border border-[#e9e2d6] bg-[#f7f5f0] p-3"
        >
          <div>
            <p className="text-sm font-semibold">{place.name}</p>
            <p className="mt-1 text-xs text-[#746a5c]">{place.area}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["restore", "keep", "maybe"] as const).map((action) => (
              <button
                key={action}
                className="rounded-lg border border-[#d8cfbf] bg-white px-2 py-2 text-xs font-semibold hover:border-[#9d8f7a]"
                type="button"
                onClick={() =>
                  updateState((current) =>
                    applyRecommendationAction(current, {
                      placeId: place.placeId,
                      action,
                    }),
                  )
                }
              >
                {action === "restore"
                  ? "다시 보기"
                  : action === "keep"
                    ? "Keep"
                    : "Maybe"}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  </details>
) : null}
```

- [x] **Step 3: Run focused verification**

Run: `npm run test:domain` and `npm run typecheck`.

Expected: all domain tests pass and TypeScript exits 0.

### Task 3: Complete Verification And Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-13-recoverable-hidden-places.md` to check completed steps

- [x] **Step 1: Run the full quality gate**

Run in order:

```powershell
npm run test:domain
npm run typecheck
npm run lint
npm run build
```

Expected: every command exits 0, with no skipped or failing domain tests.

- [x] **Step 2: Review scope**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat HEAD
git diff -- package.json package-lock.json
```

Expected: no whitespace errors, no production dependency changes, and only issue #8 persistence plus recoverable-Hide files are present.

- [ ] **Step 3: Commit the implementation**

Stage the issue #8 implementation and recovery files explicitly, then commit:

```powershell
git add -- docs/superpowers/plans/2026-07-12-trip-snapshot-storage.md docs/superpowers/plans/2026-07-13-recoverable-hidden-places.md src/app/recommendation-explorer.tsx src/domain/index.ts src/domain/recommendation-explorer.ts src/domain/services.test.ts src/domain/services.ts src/domain/trip-plan-snapshot.ts src/domain/trip-workspace.ts
git commit -m "feat: persist recoverable trip selections"
```

- [ ] **Step 4: Prepare the publish handoff**

Confirm the branch is `codex/issue-8-trip-snapshot-storage`, rerun `git status --short --branch`, then use the existing GitHub publish workflow to push and open a draft PR with `Closes #8` after the user-facing mobile smoke check is confirmed.
