import { getRecommendedPlaces } from "../../recommendations/model/recommendation-service";
import { taipeiPlaces } from "../../../demo/taipei/sample-data";
import { createTripWorkspaceView } from "../../itinerary/model/trip-workspace";

import type { RecommendationExplorerState } from "../../recommendations/model/recommendation-explorer";
import type { TripPlanSnapshot } from "./types";

export function createTripPlanSnapshot(
  state: RecommendationExplorerState,
  savedAt: string,
): TripPlanSnapshot {
  const workspace = createTripWorkspaceView(state);

  return {
    snapshotId: `snapshot-${state.trip.tripId}`,
    schemaVersion: 1,
    trip: state.trip,
    userSelections: state.selections,
    selectedBundleCourseIds: state.selectedBundleCourseIds,
    accommodationChoice: state.accommodationChoice,
    routeDraft: workspace.routeItems,
    mapCandidates: workspace.mapCandidates,
    savedAt,
    source: "sample",
  };
}

export function restoreRecommendationExplorerState(
  snapshot: TripPlanSnapshot,
): RecommendationExplorerState {
  return {
    trip: snapshot.trip,
    selections: snapshot.userSelections,
    recommendations: getRecommendedPlaces({
      trip: snapshot.trip,
      places: taipeiPlaces,
      selections: snapshot.userSelections,
    }),
    selectedBundleCourseIds: snapshot.selectedBundleCourseIds,
    accommodationChoice: snapshot.accommodationChoice,
  };
}
