# Guided Recommendations First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start issue #5 with a tested, UI-independent state boundary for Taipei recommendation keep, maybe, and hide actions.

**Architecture:** Add one small domain module that owns only recommendation-explorer state transitions. It reuses the existing recommendation and selection services; the later client component can render this state without duplicating business rules.

**Tech Stack:** TypeScript, Node built-in test runner, existing Travelus domain services.

## Global Constraints

- Preserve the approved Taipei 3-night/4-day default scenario.
- Add no dependencies and no speculative UI framework or generalized state library.
- Keep business rules outside React UI code.
- Stop this slice after the first verified domain-state boundary; page wiring is the next slice.

---

### Task 1: Recommendation explorer state transitions

**Files:**
- Create: `src/domain/recommendation-explorer.ts`
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/index.ts`

**Interfaces:**
- Consumes: `taipeiTrip`, `taipeiPlaces`, `getRecommendedPlaces`, and `applyPlaceSelection`.
- Produces: `createRecommendationExplorerState()` and `applyRecommendationAction(state, action)`.

- [x] **Step 1: Write the failing default-state test**

```ts
test("recommendation explorer starts with the Taipei 3-night 4-day defaults", () => {
  const state = createRecommendationExplorerState();

  assert.equal(state.trip.destination.city, "Taipei");
  assert.equal(state.trip.durationDays, 4);
  assert.equal(state.trip.companionCount, 2);
  assert.equal(state.recommendations.length, taipeiPlaces.length);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm run test:domain`

Expected: TypeScript compilation fails because `./recommendation-explorer` does not exist.

- [x] **Step 3: Implement the minimal initial state**

```ts
import { getRecommendedPlaces } from "./services";
import { taipeiPlaces, taipeiTrip } from "./taipei-sample-data";
import type { Place, Trip, UserPlaceSelection } from "./types";

export interface RecommendationExplorerState {
  readonly trip: Trip;
  readonly selections: readonly UserPlaceSelection[];
  readonly recommendations: readonly Place[];
}

export function createRecommendationExplorerState(): RecommendationExplorerState {
  return {
    trip: taipeiTrip,
    selections: [],
    recommendations: getRecommendedPlaces({ trip: taipeiTrip, places: taipeiPlaces }),
  };
}
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:domain`

Expected: 7 tests pass.

- [x] **Step 5: Write the failing keep/maybe/hide transition test**

```ts
test("recommendation actions classify places and hide excluded cards", () => {
  let state = createRecommendationExplorerState();

  state = applyRecommendationAction(state, {
    placeId: "taipei-101-observatory",
    action: "keep",
  });
  state = applyRecommendationAction(state, {
    placeId: "beitou-hot-spring-museum",
    action: "maybe",
  });
  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "hide",
  });

  assert.equal(state.selections[0]?.selectionType, "must_go");
  assert.equal(state.selections[1]?.selectionType, "interested");
  assert.equal(state.selections[2]?.selectionType, "excluded");
  assert.equal(
    state.recommendations.some((place) => place.placeId === "longshan-temple"),
    false,
  );
});
```

- [x] **Step 6: Run the focused test and verify RED**

Run: `npm run test:domain`

Expected: TypeScript compilation fails because `applyRecommendationAction` is not exported.

- [x] **Step 7: Implement the minimal action transition**

```ts
import { applyPlaceSelection, getRecommendedPlaces } from "./services";
import type { SelectionType } from "./types";

export type RecommendationAction = "keep" | "maybe" | "hide";

const selectionTypeByAction: Record<RecommendationAction, SelectionType> = {
  keep: "must_go",
  maybe: "interested",
  hide: "excluded",
};

export function applyRecommendationAction(
  state: RecommendationExplorerState,
  action: { readonly placeId: string; readonly action: RecommendationAction },
): RecommendationExplorerState {
  const selections = applyPlaceSelection(state.selections, {
    tripId: state.trip.tripId,
    placeId: action.placeId,
    selectionType: selectionTypeByAction[action.action],
  });

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

- [x] **Step 8: Export the new module and verify all checks**

Add `export * from "./recommendation-explorer";` to `src/domain/index.ts`.

Run: `npm run test:domain && npm run typecheck && npm run lint && npm run build`

Expected: 8 tests pass, typecheck and lint exit 0, and the production build succeeds.
