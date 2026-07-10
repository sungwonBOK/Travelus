import type {
  BundleCourse,
  Coordinates,
  MapCandidate,
  Place,
  RouteDraft,
} from "./types";

export type MapPinKind = "route" | "interest" | "nearby" | "rainy_day";

export interface MapPin {
  readonly pinId: string;
  readonly kind: MapPinKind;
  readonly placeId: string;
  readonly label: string;
  readonly coordinates: Coordinates;
  readonly description: string;
  readonly routeOrder?: number;
}

export function createMapPins({
  routes,
  candidates,
  places,
  bundleCourses,
}: {
  readonly routes: readonly RouteDraft[];
  readonly candidates: readonly MapCandidate[];
  readonly places: readonly Place[];
  readonly bundleCourses: readonly BundleCourse[];
}): readonly MapPin[] {
  const placeById = new Map(places.map((place) => [place.placeId, place]));
  const courseById = new Map(
    bundleCourses.map((course) => [course.courseId, course]),
  );
  const routePins = routes.flatMap((route, index) => {
    const placeId =
      route.placeId ??
      (route.courseId
        ? courseById.get(route.courseId)?.includedPlaceIds[0]
        : undefined);
    const place = placeId ? placeById.get(placeId) : undefined;

    if (!place) {
      return [];
    }

    return [
      {
        pinId: route.routeId,
        kind: "route" as const,
        placeId: place.placeId,
        label: route.title,
        coordinates: place.coordinates,
        description: route.recommendedReason,
        routeOrder: index + 1,
      },
    ];
  });
  const seenCandidateKeys = new Set<string>();
  const candidatePins = candidates.flatMap((candidate) => {
    const place = placeById.get(candidate.placeId);
    const kind = getCandidatePinKind(candidate);
    const key = `${kind}:${candidate.placeId}`;

    if (!place || seenCandidateKeys.has(key)) {
      return [];
    }

    seenCandidateKeys.add(key);

    return [
      {
        pinId: candidate.candidateId,
        kind,
        placeId: place.placeId,
        label: place.name,
        coordinates: place.coordinates,
        description: candidate.recommendationReason,
      },
    ];
  });

  return [...routePins, ...candidatePins];
}

function getCandidatePinKind(
  candidate: MapCandidate,
): Exclude<MapPinKind, "route"> {
  if (candidate.candidateType === "nearby") {
    return "nearby";
  }

  if (
    candidate.candidateType === "rainy_day" ||
    candidate.weatherCondition === "rain"
  ) {
    return "rainy_day";
  }

  return "interest";
}
