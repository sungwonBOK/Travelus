# Guided Recommendations UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete issue #5 with a mobile-first Taipei trip setup form and interactive recommendation cards backed by the existing tested explorer state.

**Architecture:** Keep trip setup and selection behavior in `src/domain/recommendation-explorer.ts`. Add one client component that owns only browser interaction and rendering, while `page.tsx` remains a minimal route entry point.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node built-in test runner.

## Global Constraints

- Default to Taipei, 3 nights/4 days, 2 companions, and the existing sample travel styles.
- Add no dependencies, API calls, persistence, maps, authentication, or workspace tabs.
- Reuse `Place`, `Trip`, `TravelStyle`, `applyPlaceSelection`, and `getRecommendedPlaces`.
- Keep domain behavior out of React event handlers beyond calling tested state transitions.
- Preserve the untracked user-owned `AGENTS.md` without staging or modifying it.

---

### Task 1: Update trip setup in the explorer state

**Files:**
- Modify: `src/domain/recommendation-explorer.ts`
- Modify: `src/domain/services.test.ts`

**Interfaces:**
- Consumes: `RecommendationExplorerState`, `TravelStyle`, and existing recommendation sorting.
- Produces: `RecommendationTripSetup` and `updateRecommendationTripSetup(state, setup)`.

- [x] **Step 1: Write the failing trip setup test**

```ts
test("trip setup updates duration, companions, styles, and recommendation order", () => {
  const state = updateRecommendationTripSetup(
    createRecommendationExplorerState(),
    {
      durationDays: 5,
      companionCount: 3,
      travelStyles: ["food_focused"],
    },
  );

  assert.equal(state.trip.durationDays, 5);
  assert.equal(state.trip.endDate, "2026-10-14");
  assert.equal(state.trip.companionCount, 3);
  assert.deepEqual(state.trip.travelStyles, ["food_focused"]);
  assert.deepEqual(
    state.recommendations,
    getRecommendedPlaces({ trip: state.trip, places: taipeiPlaces }),
  );
});
```

- [x] **Step 2: Run the domain suite and verify RED**

Run: `npm run test:domain`

Expected: TypeScript fails because `updateRecommendationTripSetup` is not exported.

- [x] **Step 3: Implement the minimum state transition**

```ts
export interface RecommendationTripSetup {
  readonly durationDays: number;
  readonly companionCount: number;
  readonly travelStyles: readonly TravelStyle[];
}

export function updateRecommendationTripSetup(
  state: RecommendationExplorerState,
  setup: RecommendationTripSetup,
): RecommendationExplorerState {
  const endDate = new Date(`${state.trip.startDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + setup.durationDays - 1);

  const trip: Trip = {
    ...state.trip,
    endDate: endDate.toISOString().slice(0, 10),
    durationDays: setup.durationDays,
    companionCount: setup.companionCount,
    travelStyles: setup.travelStyles,
  };

  return {
    ...state,
    trip,
    recommendations: getRecommendedPlaces({
      trip,
      places: taipeiPlaces,
      selections: state.selections,
    }),
  };
}
```

- [x] **Step 4: Run the domain suite and verify GREEN**

Run: `npm run test:domain`

Expected: 9 tests pass.

---

### Task 2: Render and operate the guided recommendation flow

**Files:**
- Create: `src/app/recommendation-explorer.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `createRecommendationExplorerState`, `updateRecommendationTripSetup`, and `applyRecommendationAction`.
- Produces: `RecommendationExplorer`, the interactive page content for issue #5.

- [x] **Step 1: Create a client component with controlled setup fields**

The component starts with:

```tsx
"use client";

import { useState } from "react";
import {
  applyRecommendationAction,
  createRecommendationExplorerState,
  updateRecommendationTripSetup,
} from "@/domain";
import type { TravelStyle } from "@/domain";

export function RecommendationExplorer() {
  const [state, setState] = useState(createRecommendationExplorerState);
  const [started, setStarted] = useState(false);

  const updateSetup = (
    setup: Partial<{
      durationDays: number;
      companionCount: number;
      travelStyles: readonly TravelStyle[];
    }>,
  ) => {
    setState((current) =>
      updateRecommendationTripSetup(current, {
        durationDays: setup.durationDays ?? current.trip.durationDays,
        companionCount: setup.companionCount ?? current.trip.companionCount,
        travelStyles: setup.travelStyles ?? current.trip.travelStyles,
      }),
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setStarted(true);
      }}
    >
      <button type="submit">추천 시작하기</button>
      {started ? <section aria-label="타이베이 추천 장소" /> : null}
    </form>
  );
}
```

Use a Taipei-only destination select, duration options for 3/4/5 days, companion input from 1 to 6, and the five existing `TravelStyle` values. The primary button reveals recommendations without navigation or persistence.

- [x] **Step 2: Render cards from domain places**

For each `state.recommendations` item, render these exact fields:

```tsx
<h3>{place.name}</h3>
<span>{place.area}</span>
<span>{categoryLabels[place.category]}</span>
<span>{place.recommendedTimeTags.map((tag) => timeLabels[tag]).join(" · ")}</span>
<span>{place.averageStayMinutes}분</span>
<span>{difficultyLabels[place.difficulty]}</span>
<p>{place.recommendationReason}</p>
```

Keep, Maybe, and Hide buttons call `applyRecommendationAction`. Keep maps to `must_go`, Maybe maps to `interested`, and Hide removes the card through the existing tested state transition.

- [x] **Step 3: Replace the static route content**

```tsx
import { RecommendationExplorer } from "./recommendation-explorer";

export default function Home() {
  return <RecommendationExplorer />;
}
```

- [x] **Step 4: Run code verification**

Run: `npm run test:domain && npm run typecheck && npm run lint && npm run build`

Expected: 9 tests pass and all three static checks exit 0.

- [x] **Step 5: Smoke-test the browser flow**

Run the dev server and verify at mobile viewport:

1. Taipei and 3 nights/4 days appear by default.
2. Changing companions and travel styles updates the setup summary.
3. Starting recommendations reveals cards with every required field.
4. Keep and Maybe show selected state.
5. Hide removes the selected card.
