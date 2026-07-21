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
