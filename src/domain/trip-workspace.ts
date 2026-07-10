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
  const placeById = new Map<string, Place>(
    taipeiPlaces.map((place) => [place.placeId, place]),
  );
  const selectedPlaces = (selectionType: "must_go" | "interested") =>
    state.selections.flatMap((selection) => {
      if (selection.selectionType !== selectionType) {
        return [];
      }

      const place = placeById.get(selection.placeId);
      return place ? [place] : [];
    });

  return {
    planDays: Array.from(
      { length: state.trip.durationDays },
      (_, index) => ({
        day: index + 1,
        items: plan.routeDraft.filter((item) => item.day === index + 1),
      }),
    ),
    routeItems: plan.routeDraft,
    mapCandidates: plan.mapCandidates,
    saved: {
      mustGo: selectedPlaces("must_go"),
      interested: selectedPlaces("interested"),
    },
  };
}
