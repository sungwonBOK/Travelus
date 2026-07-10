import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPlaceSelection,
  createTripPlanStorage,
  generateLooseRoutePlan,
  getRecommendedPlaces,
  getRouteEligibleSelections,
} from "./services";
import {
  taipeiBundleCourses,
  taipeiPlaces,
  taipeiTrip,
  taipeiTripPlanSnapshot,
  taipeiUserSelections,
} from "./taipei-sample-data";

import type { Place, Trip, UserPlaceSelection } from "./types";

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
