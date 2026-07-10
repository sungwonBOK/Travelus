import { applyPlaceSelection, getRecommendedPlaces } from "./services";
import { taipeiPlaces, taipeiTrip } from "./taipei-sample-data";

import type {
  Place,
  SelectionType,
  Trip,
  UserPlaceSelection,
} from "./types";

export type RecommendationAction = "keep" | "maybe" | "hide";

const selectionTypeByAction: Record<RecommendationAction, SelectionType> = {
  keep: "must_go",
  maybe: "interested",
  hide: "excluded",
};

export interface RecommendationExplorerState {
  readonly trip: Trip;
  readonly selections: readonly UserPlaceSelection[];
  readonly recommendations: readonly Place[];
}

export function createRecommendationExplorerState(): RecommendationExplorerState {
  return {
    trip: taipeiTrip,
    selections: [],
    recommendations: getRecommendedPlaces({
      trip: taipeiTrip,
      places: taipeiPlaces,
    }),
  };
}

export function applyRecommendationAction(
  state: RecommendationExplorerState,
  action: {
    readonly placeId: string;
    readonly action: RecommendationAction;
  },
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
