# Editable Trip Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete issue #6 with Plan, Map, and Saved tabs that reflect the user's current Keep and Maybe choices without presenting a rigid timetable.

**Architecture:** Add one pure domain view-model that converts `RecommendationExplorerState` into daily route groups, map candidates, and separated saved places. Add one client tab component and let the existing recommendation screen switch between exploration and workspace views while preserving state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node built-in test runner.

## Global Constraints

- Reuse `generateLooseRoutePlan`, `taipeiPlaces`, and existing selection types.
- Add no map API, drag-and-drop library, persistence, authentication, or new dependency.
- Plan remains day/time-block guidance rather than a minute-by-minute itinerary.
- Map is a structured mock surface; issue #7 owns the full mock-map panel.
- Saved separates `must_go` and `interested` without duplicating selection rules.
- Preserve the untracked user-owned `AGENTS.md` without staging or modifying it.

---

### Task 1: Build the workspace view-model

**Files:**
- Create: `src/domain/trip-workspace.ts`
- Modify: `src/domain/services.test.ts`
- Modify: `src/domain/index.ts`

**Interfaces:**
- Consumes: `RecommendationExplorerState`.
- Produces: `TripWorkspaceView` and `createTripWorkspaceView(state)`.

- [x] **Step 1: Write the failing workspace projection test**

```ts
test("trip workspace groups the route, map candidates, and saved selections", () => {
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

  const workspace = createTripWorkspaceView(state);

  assert.equal(workspace.planDays.length, 4);
  assert.equal(
    workspace.routeItems.some((item) => item.placeId === "taipei-101-observatory"),
    true,
  );
  assert.equal(
    workspace.mapCandidates.some(
      (candidate) => candidate.placeId === "beitou-hot-spring-museum",
    ),
    true,
  );
  assert.deepEqual(
    workspace.saved.mustGo.map((place) => place.placeId),
    ["taipei-101-observatory"],
  );
  assert.deepEqual(
    workspace.saved.interested.map((place) => place.placeId),
    ["beitou-hot-spring-museum"],
  );
});
```

- [x] **Step 2: Run the domain suite and verify RED**

Run: `npm run test:domain`

Expected: TypeScript fails because `./trip-workspace` does not exist.

- [x] **Step 3: Implement the minimum view-model**

```ts
import { taipeiPlaces } from "./taipei-sample-data";
import { generateLooseRoutePlan } from "./services";
import type { RecommendationExplorerState } from "./recommendation-explorer";
import type { MapCandidate, Place, RouteDraft } from "./types";

export interface TripWorkspaceView {
  readonly planDays: readonly {
    readonly day: number;
    readonly items: readonly RouteDraft[];
  }[];
  readonly routeItems: readonly RouteDraft[];
  readonly mapCandidates: readonly MapCandidate[];
  readonly saved: {
    readonly mustGo: readonly Place[];
    readonly interested: readonly Place[];
  };
}

export function createTripWorkspaceView(
  state: RecommendationExplorerState,
): TripWorkspaceView {
  const plan = generateLooseRoutePlan({
    trip: state.trip,
    places: taipeiPlaces,
    selections: state.selections,
  });
  const placeById = new Map(taipeiPlaces.map((place) => [place.placeId, place]));
  const selectedPlaces = (selectionType: "must_go" | "interested") =>
    state.selections.flatMap((selection) => {
      if (selection.selectionType !== selectionType) return [];
      const place = placeById.get(selection.placeId);
      return place ? [place] : [];
    });

  return {
    planDays: Array.from({ length: state.trip.durationDays }, (_, index) => ({
      day: index + 1,
      items: plan.routeDraft.filter((item) => item.day === index + 1),
    })),
    routeItems: plan.routeDraft,
    mapCandidates: plan.mapCandidates,
    saved: {
      mustGo: selectedPlaces("must_go"),
      interested: selectedPlaces("interested"),
    },
  };
}
```

- [x] **Step 4: Export the module and verify GREEN**

Add `export * from "./trip-workspace";` to `src/domain/index.ts`.

Run: `npm run test:domain`

Expected: 10 tests pass.

---

### Task 2: Connect the Plan, Map, and Saved tabs

**Files:**
- Create: `src/app/trip-workspace.tsx`
- Modify: `src/app/recommendation-explorer.tsx`

**Interfaces:**
- Consumes: `RecommendationExplorerState` and `createTripWorkspaceView`.
- Produces: `TripWorkspace({ state, onBack })`.

- [x] **Step 1: Create the tab component**

```tsx
"use client";

import { useState } from "react";
import { createTripWorkspaceView } from "@/domain";
import type { RecommendationExplorerState } from "@/domain";

type WorkspaceTab = "plan" | "map" | "saved";

export function TripWorkspace({
  state,
  onBack,
}: {
  readonly state: RecommendationExplorerState;
  readonly onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("plan");
  const workspace = createTripWorkspaceView(state);

  return (
    <section aria-label="편집 가능한 여행 작업공간">
      <button type="button" onClick={onBack}>추천 계속 고르기</button>
      {(["plan", "map", "saved"] as const).map((tab) => (
        <button
          key={tab}
          aria-pressed={activeTab === tab}
          type="button"
          onClick={() => setActiveTab(tab)}
        >
          {tab === "plan" ? "Plan" : tab === "map" ? "Map" : "Saved"}
        </button>
      ))}
      {activeTab === "plan" ? <div aria-label="일자별 느슨한 루트" /> : null}
      {activeTab === "map" ? <div aria-label="루트와 관심 후보 지도" /> : null}
      {activeTab === "saved" ? <div aria-label="저장한 장소" /> : null}
    </section>
  );
}
```

Render every `planDays` entry with its route items or a free-time message. Render route items and `mapCandidates` as separate pin groups in Map. Render `saved.mustGo` and `saved.interested` as separate sections in Saved.

- [x] **Step 2: Add the workspace transition to recommendations**

Import `TripWorkspace`, add `workspaceOpen` state, show `작업공간 열기` when at least one place is selected, and replace the recommendation list with `TripWorkspace` while it is open. `onBack` returns to the same recommendation state.

- [x] **Step 3: Run code verification**

Run: `npm run test:domain && npm run typecheck && npm run lint && npm run build`

Expected: 10 tests pass and all static checks exit 0.

- [x] **Step 4: Smoke-test the browser flow**

At a 390×844 viewport: start recommendations, Keep one place, Maybe another, open the workspace, switch through Plan/Map/Saved, verify each view reflects the selections, then return to recommendations without losing state.
