import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPlaceSelection,
  createTripPlanStorage,
  getRecommendedPlaces,
  getRouteEligibleSelections,
} from "./services";
import {
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
