import { createMapPins } from "./map-projection";
import {
  taipeiBundleCourses,
  taipeiMapCandidates,
  taipeiPlaces,
} from "./taipei-sample-data";
import { generateLooseRoutePlan } from "./services";

import type { RecommendationExplorerState } from "./recommendation-explorer";
import type { MapPin } from "./map-projection";
import type { BundleCourse, MapCandidate, Place, RouteDraft } from "./types";

export interface TripWorkspaceView {
  readonly planDays: readonly {
    readonly day: number;
    readonly items: readonly RouteDraft[];
  }[];
  readonly routeItems: readonly RouteDraft[];
  readonly mapCandidates: readonly MapCandidate[];
  readonly mapPins: readonly MapPin[];
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
  const courseById = new Map<string, BundleCourse>(
    taipeiBundleCourses.map((course) => [course.courseId, course]),
  );
  const excludedPlaceIds = new Set(
    state.selections
      .filter((selection) => selection.selectionType === "excluded")
      .map((selection) => selection.placeId),
  );
  const routedPlaceIds = new Set(
    plan.routeDraft.flatMap((route) => {
      if (route.placeId) {
        return [route.placeId];
      }

      return route.courseId
        ? (courseById.get(route.courseId)?.includedPlaceIds ?? [])
        : [];
    }),
  );
  const supplementalCandidates = taipeiMapCandidates.filter(
    (candidate) =>
      (candidate.candidateType === "nearby" ||
        candidate.candidateType === "rainy_day") &&
      !excludedPlaceIds.has(candidate.placeId) &&
      !routedPlaceIds.has(candidate.placeId),
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
    mapPins: createMapPins({
      routes: plan.routeDraft,
      candidates: [...plan.mapCandidates, ...supplementalCandidates],
      places: taipeiPlaces,
      bundleCourses: taipeiBundleCourses,
    }),
    saved: {
      mustGo: selectedPlaces("must_go"),
      interested: selectedPlaces("interested"),
    },
  };
}
