import { taipeiPlaces } from "./taipei-sample-data";

import type {
  Place,
  PlaceCategory,
  SelectionType,
  TravelStyle,
  Trip,
  TripPlanSnapshot,
  UserPlaceSelection,
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

const DEFAULT_TRIP_PLAN_STORAGE_KEY = "travelus:trip-plan-snapshot:v1";

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
