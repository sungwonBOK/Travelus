import assert from "node:assert/strict";
import test from "node:test";

import { positionMapPins } from "../app/mock-map-position";
import {
  applyPlaceSelection,
  createTripPlanStorage,
  generateLooseRoutePlan,
  getRecommendedPlaces,
  getRouteEligibleSelections,
} from "./services";
import {
  applyRecommendationAction,
  createRecommendationExplorerState,
  getHiddenRecommendations,
  updateRecommendationTripSetup,
} from "./recommendation-explorer";
import { createMapPins } from "./map-projection";
import {
  taipeiAccommodationAreas,
  taipeiBundleCourses,
  taipeiMapCandidates,
  taipeiPlaces,
  taipeiRouteDraft,
  taipeiTrip,
  taipeiTripPlanSnapshot,
  taipeiUserSelections,
} from "./taipei-sample-data";
import {
  createTripPlanSnapshot,
  restoreRecommendationExplorerState,
} from "./trip-plan-snapshot";
import { createTripWorkspaceView } from "./trip-workspace";

import type { MapCandidate, Place, Trip, UserPlaceSelection } from "./types";

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

test("map projection preserves coordinates for route and candidate pin kinds", () => {
  const pins = createMapPins({
    routes: taipeiRouteDraft.slice(0, 2),
    candidates: taipeiMapCandidates.slice(0, 3),
    places: taipeiPlaces,
    bundleCourses: taipeiBundleCourses,
  });

  assert.deepEqual(
    [...new Set(pins.map((pin) => pin.kind))].sort(),
    ["interest", "nearby", "rainy_day", "route"],
  );
  assert.deepEqual(
    pins.filter((pin) => pin.kind === "route").map((pin) => pin.routeOrder),
    [1, 2],
  );

  const placeById = new Map<string, Place>(
    taipeiPlaces.map((place) => [place.placeId, place]),
  );

  for (const pin of pins) {
    assert.deepEqual(pin.coordinates, placeById.get(pin.placeId)?.coordinates);
  }
});

test("mock map positioning fans out different pin kinds at the same coordinates", () => {
  const nearbyCandidate = taipeiMapCandidates.find(
    (candidate) => candidate.candidateType === "nearby",
  );
  assert.ok(nearbyCandidate);
  const interestCandidate: MapCandidate = {
    ...nearbyCandidate,
    candidateId: "candidate-yongkang-interest",
    candidateType: "interest",
  };
  const pins = createMapPins({
    routes: [],
    candidates: [interestCandidate, nearbyCandidate],
    places: taipeiPlaces,
    bundleCourses: taipeiBundleCourses,
  });

  assert.deepEqual(
    pins.map((pin) => pin.coordinates),
    [nearbyCandidate, nearbyCandidate].map(
      () =>
        taipeiPlaces.find(
          (place) => place.placeId === nearbyCandidate.placeId,
        )?.coordinates,
    ),
  );

  const positionedPins = positionMapPins(pins);

  assert.notDeepEqual(
    { x: positionedPins[0]?.x, y: positionedPins[0]?.y },
    { x: positionedPins[1]?.x, y: positionedPins[1]?.y },
  );
});

test("recommendation explorer starts with the Taipei 3-night 4-day defaults", () => {
  const state = createRecommendationExplorerState();

  assert.equal(state.trip.destination.city, "Taipei");
  assert.equal(state.trip.durationDays, 4);
  assert.equal(state.trip.companionCount, 2);
  assert.equal(state.recommendations.length, taipeiPlaces.length);
});

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
    state.recommendations.some(
      (place) => place.placeId === "longshan-temple",
    ),
    false,
  );
});

test("hidden recommendations remain recoverable", () => {
  let state = createRecommendationExplorerState();

  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "hide",
  });

  assert.equal(
    state.recommendations.some(
      (place) => place.placeId === "longshan-temple",
    ),
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
    state.selections.some(
      (selection) => selection.placeId === "longshan-temple",
    ),
    false,
  );
  assert.equal(
    state.recommendations.some(
      (place) => place.placeId === "longshan-temple",
    ),
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
    state.selections.filter(
      (selection) => selection.placeId === "longshan-temple",
    ).length,
    1,
  );
  assert.equal(
    state.selections.find(
      (selection) => selection.placeId === "longshan-temple",
    )?.selectionType,
    "must_go",
  );
  assert.deepEqual(getHiddenRecommendations(state), []);
});

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
    placeId: "ximending",
    action: "maybe",
  });
  state = applyRecommendationAction(state, {
    placeId: "longshan-temple",
    action: "hide",
  });

  const workspace = createTripWorkspaceView(state);

  assert.equal(workspace.planDays.length, 4);
  assert.equal(
    workspace.routeItems.some(
      (item) => item.placeId === "taipei-101-observatory",
    ),
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
    ["beitou-hot-spring-museum", "ximending"],
  );
  assert.deepEqual(
    [...new Set(workspace.mapPins.map((pin) => pin.kind))].sort(),
    ["interest", "nearby", "rainy_day", "route"],
  );
  assert.equal(
    workspace.mapPins.every(
      (pin) =>
        Number.isFinite(pin.coordinates.lat) &&
        Number.isFinite(pin.coordinates.lng),
    ),
    true,
  );
});

test("recommendations exclude hidden places and rank food-friendly places for food-focused trips", () => {
  const foodTrip: Trip = {
    ...taipeiTrip,
    travelStyles: ["food_focused", "first_time_free_travel"],
  };

  const recommendations = getRecommendedPlaces({
    trip: foodTrip,
    places: taipeiPlaces,
    selections: [
      ...taipeiUserSelections,
      {
        selectionId: "selection-hide-longshan",
        tripId: taipeiTrip.tripId,
        placeId: "longshan-temple",
        selectionType: "excluded",
        priority: 99,
      },
    ],
  });

  const ids = recommendations.map((place: Place) => place.placeId);

  assert.equal(ids.includes("longshan-temple"), false);
  assert.ok(
    ids.indexOf("yongkang-street") < ids.indexOf("taipei-101-observatory"),
  );
  assert.ok(
    ids.indexOf("shilin-night-market") < ids.indexOf("taipei-101-observatory"),
  );
});

test("place selection actions add and update one deterministic selection per place", () => {
  const firstSelection = applyPlaceSelection([], {
    tripId: taipeiTrip.tripId,
    placeId: "taipei-101-observatory",
    selectionType: "must_go",
  });

  assert.deepEqual(firstSelection, [
    {
      selectionId: "selection-trip-taipei-3n4d-demo-taipei-101-observatory",
      tripId: taipeiTrip.tripId,
      placeId: "taipei-101-observatory",
      selectionType: "must_go",
      priority: 1,
    },
  ]);

  const updatedSelection = applyPlaceSelection(firstSelection, {
    tripId: taipeiTrip.tripId,
    placeId: "taipei-101-observatory",
    selectionType: "interested",
    userNote: "Move to optional map candidate.",
  });

  assert.equal(updatedSelection.length, 1);
  assert.equal(updatedSelection[0]?.selectionType, "interested");
  assert.equal(updatedSelection[0]?.priority, 1);
  assert.equal(updatedSelection[0]?.userNote, "Move to optional map candidate.");
});

test("route eligible selections omit excluded places while preserving keep and maybe candidates", () => {
  const selections = applyPlaceSelection(taipeiUserSelections, {
    tripId: taipeiTrip.tripId,
    placeId: "jiufen-old-street",
    selectionType: "excluded",
  });

  const eligible = getRouteEligibleSelections(selections);
  const ids = eligible.map((selection: UserPlaceSelection) => selection.placeId);

  assert.equal(ids.includes("jiufen-old-street"), false);
  assert.equal(ids.includes("taipei-101-observatory"), true);
  assert.equal(ids.includes("beitou-hot-spring-museum"), true);
});

test("trip plan storage saves versioned snapshots behind a replaceable adapter", () => {
  const memoryStorage = new MemoryStorage();
  const storage = createTripPlanStorage({
    key: "travelus:test:snapshot",
    storage: memoryStorage,
  });

  assert.equal(storage.load(), null);

  storage.save(taipeiTripPlanSnapshot);
  const loaded = storage.load();

  assert.equal(loaded?.schemaVersion, 1);
  assert.equal(loaded?.snapshotId, taipeiTripPlanSnapshot.snapshotId);
  assert.equal(loaded?.trip.tripId, taipeiTrip.tripId);

  memoryStorage.setItem(
    "travelus:test:snapshot",
    JSON.stringify({ schemaVersion: 99 }),
  );

  assert.equal(storage.load(), null);
});

test("trip plan snapshots round-trip the complete editable plan", () => {
  let state = updateRecommendationTripSetup(
    createRecommendationExplorerState(),
    {
      durationDays: 5,
      companionCount: 3,
      travelStyles: ["food_focused"],
    },
  );
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
  state = {
    ...state,
    selectedBundleCourseIds: ["taipei-night-market-food-route"],
    accommodationChoice: taipeiAccommodationAreas[1],
  };

  const snapshot = createTripPlanSnapshot(
    state,
    "2026-07-12T05:10:00.000Z",
  );
  const memoryStorage = new MemoryStorage();
  const storage = createTripPlanStorage({
    key: "travelus:test:complete-snapshot",
    storage: memoryStorage,
  });
  storage.save(snapshot);
  const loaded = storage.load();

  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, 1);
  assert.equal(loaded.savedAt, "2026-07-12T05:10:00.000Z");
  assert.equal(loaded.trip.durationDays, 5);
  assert.equal(loaded.trip.companionCount, 3);
  assert.deepEqual(loaded.trip.travelStyles, ["food_focused"]);
  assert.deepEqual(loaded.userSelections, state.selections);
  assert.deepEqual(loaded.selectedBundleCourseIds, [
    "taipei-night-market-food-route",
  ]);
  assert.equal(loaded.accommodationChoice.areaId, "zhongshan");
  assert.ok(loaded.routeDraft.length > 0);
  assert.ok(loaded.mapCandidates.length > 0);

  const restored = restoreRecommendationExplorerState(loaded);

  assert.deepEqual(restored.trip, state.trip);
  assert.deepEqual(restored.selections, state.selections);
  assert.deepEqual(
    restored.selectedBundleCourseIds,
    state.selectedBundleCourseIds,
  );
  assert.deepEqual(restored.accommodationChoice, state.accommodationChoice);
  assert.equal(
    restored.recommendations.some(
      (place) => place.placeId === "longshan-temple",
    ),
    false,
  );
  assert.deepEqual(
    getHiddenRecommendations(restored).map((place) => place.placeId),
    ["longshan-temple"],
  );
});

test("trip plan storage rejects incomplete versioned snapshots", () => {
  const memoryStorage = new MemoryStorage();
  const key = "travelus:test:incomplete-snapshot";
  const storage = createTripPlanStorage({ key, storage: memoryStorage });

  memoryStorage.setItem(
    key,
    JSON.stringify({
      schemaVersion: 1,
      trip: taipeiTrip,
    }),
  );

  assert.equal(storage.load(), null);
});

test("route generation prioritizes must-go selections and bundle courses deterministically", () => {
  const request = {
    trip: taipeiTrip,
    places: taipeiPlaces,
    bundleCourses: taipeiBundleCourses,
    selections: taipeiUserSelections,
    selectedBundleCourseIds: [
      "yehliu-shifen-jiufen-day",
      "taipei-night-market-food-route",
    ],
  };

  const firstPlan = generateLooseRoutePlan(request);
  const secondPlan = generateLooseRoutePlan(request);
  const routeKeys = firstPlan.routeDraft.map(
    (route) => route.courseId ?? route.placeId,
  );

  assert.deepEqual(firstPlan, secondPlan);
  assert.deepEqual(routeKeys, [
    "taipei-night-market-food-route",
    "taipei-101-observatory",
    "yehliu-shifen-jiufen-day",
  ]);
  assert.deepEqual(
    firstPlan.routeDraft.map((route) => route.timeBlock),
    ["evening", "sunset", "morning"],
  );
  assert.deepEqual(
    firstPlan.routeDraft.map((route) => route.day),
    [1, 2, 3],
  );
  assert.equal(
    firstPlan.routeDraft.find(
      (route) => route.placeId === "taipei-101-observatory",
    )?.isLocked,
    true,
  );
  assert.ok(
    firstPlan.routeDraft.every((route) => route.difficultyScore >= 1),
  );
  assert.ok(
    firstPlan.routeDraft.every(
      (route) => route.travelTimeToNextMinutes >= 0,
    ),
  );
});

test("route generation omits excluded places and keeps interested places as map candidates", () => {
  const plan = generateLooseRoutePlan({
    trip: taipeiTrip,
    places: taipeiPlaces,
    bundleCourses: taipeiBundleCourses,
    selections: [
      ...taipeiUserSelections,
      {
        selectionId: "selection-exclude-jiufen",
        tripId: taipeiTrip.tripId,
        placeId: "jiufen-old-street",
        selectionType: "excluded",
        priority: 5,
      },
    ],
    selectedBundleCourseIds: ["yehliu-shifen-jiufen-day"],
  });
  const routeKeys = plan.routeDraft.map(
    (route) => route.courseId ?? route.placeId,
  );
  const candidateIds = plan.mapCandidates.map((candidate) => candidate.placeId);

  assert.equal(routeKeys.includes("yehliu-shifen-jiufen-day"), false);
  assert.equal(routeKeys.includes("jiufen-old-street"), false);
  assert.equal(candidateIds.includes("jiufen-old-street"), false);
  assert.equal(candidateIds.includes("beitou-hot-spring-museum"), true);
  assert.equal(candidateIds.includes("shilin-night-market"), true);
  assert.equal(
    plan.mapCandidates.find(
      (candidate) => candidate.placeId === "beitou-hot-spring-museum",
    )?.weatherCondition,
    "rain",
  );
});
