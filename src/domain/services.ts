import { taipeiBundleCourses, taipeiPlaces } from "./taipei-sample-data";

import type {
  BundleCourse,
  DifficultyLevel,
  MapCandidate,
  MapCandidateType,
  Place,
  PlaceCategory,
  RouteDraft,
  SelectionType,
  TimeBlock,
  TravelStyle,
  Trip,
  TripPlanSnapshot,
  UserPlaceSelection,
  WeatherCondition,
} from "./types";

export interface RecommendationRequest {
  readonly trip: Trip;
  readonly places?: readonly Place[];
  readonly selections?: readonly UserPlaceSelection[];
}

export interface PlaceSelectionAction {
  readonly tripId: string;
  readonly placeId: string;
  readonly selectionType: SelectionType;
  readonly priority?: number;
  readonly userNote?: string;
}

export interface TripPlanStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TripPlanStorageOptions {
  readonly key?: string;
  readonly storage: TripPlanStorageAdapter;
}

export interface TripPlanStorage {
  save(snapshot: TripPlanSnapshot): void;
  load(): TripPlanSnapshot | null;
  clear(): void;
}

export interface LooseRouteGenerationRequest {
  readonly trip: Trip;
  readonly places?: readonly Place[];
  readonly bundleCourses?: readonly BundleCourse[];
  readonly selections?: readonly UserPlaceSelection[];
  readonly selectedBundleCourseIds?: readonly string[];
}

export interface LooseRouteGenerationResult {
  readonly routeDraft: readonly RouteDraft[];
  readonly mapCandidates: readonly MapCandidate[];
}

const DEFAULT_TRIP_PLAN_STORAGE_KEY = "travelus:trip-plan-snapshot:v1";
const timeBlockOrder: readonly TimeBlock[] = [
  "morning",
  "lunch",
  "afternoon",
  "sunset",
  "evening",
];
const difficultyScores: Record<DifficultyLevel, number> = {
  easy: 2,
  moderate: 4,
  high: 7,
};

const styleCategoryBoosts: Record<TravelStyle, Partial<Record<PlaceCategory, number>>> = {
  classic_landmarks: {
    landmark: 22,
    temple: 12,
    museum: 8,
  },
  day_trip: {
    day_trip: 28,
    nature: 8,
  },
  first_time_free_travel: {
    landmark: 12,
    market: 8,
    neighborhood: 8,
    temple: 8,
  },
  food_focused: {
    food: 24,
    market: 22,
    neighborhood: 12,
    cafe: 10,
  },
  slow_paced: {
    cafe: 18,
    food: 10,
    museum: 12,
    nature: 20,
    neighborhood: 8,
  },
};

export function getRecommendedPlaces({
  trip,
  places = taipeiPlaces,
  selections = [],
}: RecommendationRequest): Place[] {
  const excludedPlaceIds = new Set(
    selections
      .filter((selection) => selection.selectionType === "excluded")
      .map((selection) => selection.placeId),
  );

  return places
    .filter((place) => !excludedPlaceIds.has(place.placeId))
    .map((place) => ({
      place,
      score: getRecommendationScore(place, trip.travelStyles),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.place.name.localeCompare(right.place.name);
    })
    .map(({ place }) => place);
}

export function applyPlaceSelection(
  selections: readonly UserPlaceSelection[],
  action: PlaceSelectionAction,
): UserPlaceSelection[] {
  const existingSelection = selections.find(
    (selection) =>
      selection.tripId === action.tripId && selection.placeId === action.placeId,
  );
  const nextSelection: UserPlaceSelection = {
    selectionId:
      existingSelection?.selectionId ??
      `selection-${action.tripId}-${action.placeId}`,
    tripId: action.tripId,
    placeId: action.placeId,
    selectionType: action.selectionType,
    priority:
      action.priority ??
      existingSelection?.priority ??
      getNextSelectionPriority(selections),
    ...(action.userNote ? { userNote: action.userNote } : {}),
  };

  if (!existingSelection) {
    return [...selections, nextSelection];
  }

  return selections.map((selection) =>
    selection.selectionId === existingSelection.selectionId
      ? nextSelection
      : selection,
  );
}

export function getRouteEligibleSelections(
  selections: readonly UserPlaceSelection[],
): UserPlaceSelection[] {
  return selections.filter(
    (selection) => selection.selectionType !== "excluded",
  );
}

export function generateLooseRoutePlan({
  trip,
  places = taipeiPlaces,
  bundleCourses = taipeiBundleCourses,
  selections = [],
  selectedBundleCourseIds = [],
}: LooseRouteGenerationRequest): LooseRouteGenerationResult {
  const excludedPlaceIds = new Set(
    selections
      .filter((selection) => selection.selectionType === "excluded")
      .map((selection) => selection.placeId),
  );
  const placeById = new Map(places.map((place) => [place.placeId, place]));
  const selectedCourseIdSet = new Set(selectedBundleCourseIds);
  const selectedCourses = bundleCourses
    .filter((course) => selectedCourseIdSet.has(course.courseId))
    .filter((course) =>
      course.includedPlaceIds.every((placeId) => !excludedPlaceIds.has(placeId)),
    )
    .sort(compareBundleCourses);
  const routedPlaceIds = new Set<string>();
  const routeDraft: RouteDraft[] = [];

  for (const course of selectedCourses) {
    const day = clampDay(course.recommendedDayPosition, trip.durationDays);

    for (const placeId of course.includedPlaceIds) {
      if (!excludedPlaceIds.has(placeId)) {
        routedPlaceIds.add(placeId);
      }
    }

    routeDraft.push({
      routeId: createRouteId(
        trip.tripId,
        day,
        course.recommendedTimeBlock,
        course.courseId,
      ),
      tripId: trip.tripId,
      day,
      timeBlock: course.recommendedTimeBlock,
      itemType: "bundle_course",
      courseId: course.courseId,
      title: course.title,
      recommendedReason: course.recommendedReason,
      travelTimeToNextMinutes: 0,
      difficultyScore: Math.max(
        difficultyScores[course.difficulty],
        course.transportComplexity,
      ),
      isLocked: false,
    });
  }

  const mustGoSelections = selections
    .filter((selection) => selection.selectionType === "must_go")
    .filter((selection) => !excludedPlaceIds.has(selection.placeId))
    .filter((selection) => !routedPlaceIds.has(selection.placeId))
    .sort(compareSelections);

  for (const selection of mustGoSelections) {
    const place = placeById.get(selection.placeId);

    if (!place) {
      continue;
    }

    const timeBlock = choosePlaceTimeBlock(place);
    const day = chooseBalancedDay(routeDraft, trip.durationDays);

    routedPlaceIds.add(place.placeId);
    routeDraft.push({
      routeId: createRouteId(trip.tripId, day, timeBlock, place.placeId),
      tripId: trip.tripId,
      day,
      timeBlock,
      itemType: "place",
      placeId: place.placeId,
      title: place.name,
      recommendedReason: place.recommendationReason,
      travelTimeToNextMinutes: 0,
      difficultyScore: difficultyScores[place.difficulty],
      isLocked: true,
    });
  }

  const sortedRouteDraft = routeDraft
    .sort(compareRouteDrafts)
    .map((route, index, routes) => ({
      ...route,
      travelTimeToNextMinutes: estimateTravelTimeToNext(
        route,
        routes[index + 1],
        {
          placeById,
          courseById: new Map(
            selectedCourses.map((course) => [course.courseId, course]),
          ),
        },
      ),
    }));

  return {
    routeDraft: sortedRouteDraft,
    mapCandidates: createMapCandidates({
      trip,
      places,
      selections,
      excludedPlaceIds,
      routedPlaceIds,
      routeDraft: sortedRouteDraft,
    }),
  };
}

export function createTripPlanStorage({
  key = DEFAULT_TRIP_PLAN_STORAGE_KEY,
  storage,
}: TripPlanStorageOptions): TripPlanStorage {
  return {
    clear() {
      storage.removeItem(key);
    },
    load() {
      const rawValue = storage.getItem(key);

      if (!rawValue) {
        return null;
      }

      try {
        const parsedValue = JSON.parse(rawValue) as Partial<TripPlanSnapshot>;

        if (parsedValue.schemaVersion !== 1 || !parsedValue.trip) {
          return null;
        }

        return parsedValue as TripPlanSnapshot;
      } catch {
        return null;
      }
    },
    save(snapshot) {
      storage.setItem(key, JSON.stringify(snapshot));
    },
  };
}

function getRecommendationScore(
  place: Place,
  travelStyles: readonly TravelStyle[],
): number {
  const styleScore = travelStyles.reduce(
    (score, style) => score + (styleCategoryBoosts[style][place.category] ?? 0),
    0,
  );

  return place.beginnerScore + place.confidenceScore * 10 + styleScore;
}

function getNextSelectionPriority(
  selections: readonly UserPlaceSelection[],
): number {
  return (
    selections.reduce(
      (highestPriority, selection) =>
        Math.max(highestPriority, selection.priority),
      0,
    ) + 1
  );
}

function compareBundleCourses(left: BundleCourse, right: BundleCourse): number {
  if (left.recommendedDayPosition !== right.recommendedDayPosition) {
    return left.recommendedDayPosition - right.recommendedDayPosition;
  }

  return (
    timeBlockOrder.indexOf(left.recommendedTimeBlock) -
      timeBlockOrder.indexOf(right.recommendedTimeBlock) ||
    left.title.localeCompare(right.title)
  );
}

function compareSelections(
  left: UserPlaceSelection,
  right: UserPlaceSelection,
): number {
  return (
    left.priority - right.priority ||
    left.placeId.localeCompare(right.placeId)
  );
}

function compareRouteDrafts(left: RouteDraft, right: RouteDraft): number {
  return (
    left.day - right.day ||
    timeBlockOrder.indexOf(left.timeBlock) -
      timeBlockOrder.indexOf(right.timeBlock) ||
    left.title.localeCompare(right.title)
  );
}

function clampDay(day: number, durationDays: number): number {
  return Math.min(Math.max(day, 1), Math.max(durationDays, 1));
}

function chooseBalancedDay(
  routeDraft: readonly RouteDraft[],
  durationDays: number,
): number {
  const dayLoads = new Map<number, number>();

  for (let day = 1; day <= durationDays; day += 1) {
    dayLoads.set(day, 0);
  }

  for (const route of routeDraft) {
    dayLoads.set(route.day, (dayLoads.get(route.day) ?? 0) + 1);
  }

  return [...dayLoads.entries()].sort(
    ([leftDay, leftLoad], [rightDay, rightLoad]) =>
      leftLoad - rightLoad || leftDay - rightDay,
  )[0]?.[0] ?? 1;
}

function choosePlaceTimeBlock(place: Place): TimeBlock {
  const preferredBlocks: readonly TimeBlock[] = [
    "sunset",
    "morning",
    "lunch",
    "afternoon",
    "evening",
  ];

  return (
    preferredBlocks.find((timeBlock) =>
      place.recommendedTimeTags.includes(timeBlock),
    ) ?? place.recommendedTimeTags[0] ?? "afternoon"
  );
}

function createRouteId(
  tripId: string,
  day: number,
  timeBlock: TimeBlock,
  itemId: string,
): string {
  return `route-${tripId}-day${day}-${timeBlock}-${itemId}`;
}

function estimateTravelTimeToNext(
  route: RouteDraft,
  nextRoute: RouteDraft | undefined,
  {
    placeById,
    courseById,
  }: {
    readonly placeById: ReadonlyMap<string, Place>;
    readonly courseById: ReadonlyMap<string, BundleCourse>;
  },
): number {
  if (!nextRoute || route.day !== nextRoute.day) {
    return 0;
  }

  const origin = getRouteCoordinates(route, { placeById, courseById });
  const destination = getRouteCoordinates(nextRoute, { placeById, courseById });

  if (!origin || !destination) {
    return 20;
  }

  const latKm = (origin.lat - destination.lat) * 111;
  const lngKm = (origin.lng - destination.lng) * 101;
  const distanceKm = Math.sqrt(latKm ** 2 + lngKm ** 2);

  return Math.round(Math.max(10, distanceKm * 6));
}

function getRouteCoordinates(
  route: RouteDraft,
  {
    placeById,
    courseById,
  }: {
    readonly placeById: ReadonlyMap<string, Place>;
    readonly courseById: ReadonlyMap<string, BundleCourse>;
  },
): Place["coordinates"] | undefined {
  if (route.placeId) {
    return placeById.get(route.placeId)?.coordinates;
  }

  const firstCoursePlaceId = route.courseId
    ? courseById.get(route.courseId)?.includedPlaceIds[0]
    : undefined;

  return firstCoursePlaceId
    ? placeById.get(firstCoursePlaceId)?.coordinates
    : undefined;
}

function createMapCandidates({
  trip,
  places,
  selections,
  excludedPlaceIds,
  routedPlaceIds,
  routeDraft,
}: {
  readonly trip: Trip;
  readonly places: readonly Place[];
  readonly selections: readonly UserPlaceSelection[];
  readonly excludedPlaceIds: ReadonlySet<string>;
  readonly routedPlaceIds: ReadonlySet<string>;
  readonly routeDraft: readonly RouteDraft[];
}): MapCandidate[] {
  const placeById = new Map(places.map((place) => [place.placeId, place]));

  return selections
    .filter((selection) => selection.selectionType === "interested")
    .filter((selection) => !excludedPlaceIds.has(selection.placeId))
    .filter((selection) => !routedPlaceIds.has(selection.placeId))
    .sort(compareSelections)
    .flatMap((selection) => {
      const place = placeById.get(selection.placeId);

      if (!place) {
        return [];
      }

      return [
        {
          candidateId: `candidate-${trip.tripId}-${place.placeId}`,
          tripId: trip.tripId,
          placeId: place.placeId,
          candidateType: getCandidateType(place),
          relatedRouteDay: getCandidateRouteDay(routeDraft, trip.durationDays),
          distanceFromRouteKm: 0,
          estimatedDetourMinutes: getEstimatedDetourMinutes(place),
          recommendationReason: selection.userNote ?? place.recommendationReason,
          weatherCondition: getWeatherCondition(place),
        },
      ];
    });
}

function getCandidateType(place: Place): MapCandidateType {
  if (place.weatherSensitivity === "indoor") {
    return "rainy_day";
  }

  if (place.category === "food" || place.category === "market") {
    return "food";
  }

  if (place.category === "cafe") {
    return "cafe";
  }

  if (place.category === "shopping") {
    return "shopping";
  }

  if (place.category === "nature") {
    return "rest";
  }

  return "interest";
}

function getCandidateRouteDay(
  routeDraft: readonly RouteDraft[],
  durationDays: number,
): number {
  if (routeDraft.length === 0) {
    return 1;
  }

  return clampDay(Math.ceil(durationDays / 2), durationDays);
}

function getEstimatedDetourMinutes(place: Place): number {
  return Math.max(10, Math.round(place.averageStayMinutes / 3));
}

function getWeatherCondition(place: Place): WeatherCondition {
  if (place.weatherSensitivity === "indoor") {
    return "rain";
  }

  if (place.recommendedTimeTags.includes("evening")) {
    return "evening";
  }

  if (place.weatherSensitivity === "rain_sensitive") {
    return "clear";
  }

  return "any";
}
