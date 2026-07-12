import { applyPlaceSelection, getRecommendedPlaces } from "./services";
import {
  taipeiAccommodationAreas,
  taipeiPlaces,
  taipeiTrip,
} from "./taipei-sample-data";

import type {
  AccommodationAreaRecommendation,
  Place,
  SelectionType,
  Trip,
  TravelStyle,
  UserPlaceSelection,
} from "./types";

export type RecommendationAction = "keep" | "maybe" | "hide" | "restore";

const selectionTypeByAction: Record<
  Exclude<RecommendationAction, "restore">,
  SelectionType
> = {
  keep: "must_go",
  maybe: "interested",
  hide: "excluded",
};

export interface RecommendationExplorerState {
  readonly trip: Trip;
  readonly selections: readonly UserPlaceSelection[];
  readonly recommendations: readonly Place[];
  readonly selectedBundleCourseIds: readonly string[];
  readonly accommodationChoice: AccommodationAreaRecommendation;
}

export interface RecommendationTripSetup {
  readonly durationDays: number;
  readonly companionCount: number;
  readonly travelStyles: readonly TravelStyle[];
}

export function createRecommendationExplorerState(): RecommendationExplorerState {
  return {
    trip: taipeiTrip,
    selections: [],
    recommendations: getRecommendedPlaces({
      trip: taipeiTrip,
      places: taipeiPlaces,
    }),
    selectedBundleCourseIds: [],
    accommodationChoice: taipeiAccommodationAreas[0],
  };
}

export function getHiddenRecommendations(
  state: RecommendationExplorerState,
): Place[] {
  const hiddenPlaceIds = new Set(
    state.selections
      .filter((selection) => selection.selectionType === "excluded")
      .map((selection) => selection.placeId),
  );

  return taipeiPlaces.filter((place) => hiddenPlaceIds.has(place.placeId));
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

export function applyRecommendationAction(
  state: RecommendationExplorerState,
  action: {
    readonly placeId: string;
    readonly action: RecommendationAction;
  },
): RecommendationExplorerState {
  if (action.action === "restore") {
    const selections = state.selections.filter(
      (selection) =>
        !(
          selection.tripId === state.trip.tripId &&
          selection.placeId === action.placeId
        ),
    );

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
