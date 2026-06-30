export type DestinationId = "taipei";

export type TravelStyle =
  | "first_time_free_travel"
  | "food_focused"
  | "classic_landmarks"
  | "slow_paced"
  | "day_trip";

export type AccommodationStatus = "needed" | "booked" | "undecided";

export type PlaceCategory =
  | "landmark"
  | "temple"
  | "market"
  | "neighborhood"
  | "nature"
  | "day_trip"
  | "food"
  | "museum"
  | "shopping"
  | "cafe";

export type TimeBlock = "morning" | "lunch" | "afternoon" | "sunset" | "evening";

export type DifficultyLevel = "easy" | "moderate" | "high";

export type WeatherSensitivity =
  | "indoor"
  | "outdoor"
  | "rain_sensitive"
  | "all_weather";

export type TimeSensitivity = "low" | "medium" | "high";

export type PriceLevel = "free" | "low" | "medium" | "high";

export type RecommendationSource =
  | "sample_curated"
  | "official_tourism"
  | "local_editorial";

export type SelectionType = "must_go" | "interested" | "excluded";

export type BundleCourseType = "full_day" | "half_day" | "food_route";

export type RouteItemType = "place" | "bundle_course" | "free_time" | "meal";

export type MapCandidateType =
  | "interest"
  | "nearby"
  | "rainy_day"
  | "rest"
  | "cafe"
  | "food"
  | "shopping";

export type WeatherCondition = "any" | "clear" | "rain" | "hot" | "evening";

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface Destination {
  readonly destinationId: DestinationId;
  readonly city: string;
  readonly country: string;
  readonly displayName: string;
}

export interface OpeningHours {
  readonly note: string;
  readonly closedDays?: readonly string[];
  readonly timeRanges?: readonly {
    readonly days: readonly string[];
    readonly opensAt: string;
    readonly closesAt: string;
  }[];
}

export interface Trip {
  readonly tripId: string;
  readonly destination: Destination;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationDays: number;
  readonly companionCount: number;
  readonly travelStyles: readonly TravelStyle[];
  readonly accommodationStatus: AccommodationStatus;
  readonly selectedAccommodationArea?: string;
}

export interface Place {
  readonly placeId: string;
  readonly name: string;
  readonly category: PlaceCategory;
  readonly area: string;
  readonly coordinates: Coordinates;
  readonly openingHours: OpeningHours;
  readonly recommendedTimeTags: readonly TimeBlock[];
  readonly averageStayMinutes: number;
  readonly difficulty: DifficultyLevel;
  readonly beginnerScore: number;
  readonly weatherSensitivity: WeatherSensitivity;
  readonly timeSensitivity: TimeSensitivity;
  readonly priceLevel: PriceLevel;
  readonly source: RecommendationSource;
  readonly confidenceScore: number;
  readonly summary: string;
  readonly recommendationReason: string;
}

export interface UserPlaceSelection {
  readonly selectionId: string;
  readonly tripId: string;
  readonly placeId: string;
  readonly selectionType: SelectionType;
  readonly priority: number;
  readonly userNote?: string;
}

export interface BundleCourse {
  readonly courseId: string;
  readonly destination: DestinationId;
  readonly title: string;
  readonly type: BundleCourseType;
  readonly durationMinutes: number;
  readonly difficulty: DifficultyLevel;
  readonly beginnerScore: number;
  readonly transportComplexity: number;
  readonly freeTravelScore: number;
  readonly tourRecommendationScore: number;
  readonly includedPlaceIds: readonly string[];
  readonly recommendedTimeBlock: TimeBlock;
  readonly recommendedDayPosition: number;
  readonly affiliateAvailable: boolean;
  readonly recommendedReason: string;
}

export interface AccommodationAreaRecommendation {
  readonly areaId: string;
  readonly destination: DestinationId;
  readonly name: string;
  readonly summary: string;
  readonly averageAccessScore: number;
  readonly airportStationAccessScore: number;
  readonly nightReturnConvenienceScore: number;
  readonly beginnerSuitabilityScore: number;
  readonly travelStyleFit: readonly TravelStyle[];
  readonly recommendedReason: string;
}

export interface RouteDraft {
  readonly routeId: string;
  readonly tripId: string;
  readonly day: number;
  readonly timeBlock: TimeBlock;
  readonly itemType: RouteItemType;
  readonly placeId?: string;
  readonly courseId?: string;
  readonly title: string;
  readonly recommendedReason: string;
  readonly travelTimeToNextMinutes: number;
  readonly difficultyScore: number;
  readonly isLocked: boolean;
}

export interface MapCandidate {
  readonly candidateId: string;
  readonly tripId: string;
  readonly placeId: string;
  readonly candidateType: MapCandidateType;
  readonly relatedRouteDay: number;
  readonly distanceFromRouteKm: number;
  readonly estimatedDetourMinutes: number;
  readonly recommendationReason: string;
  readonly weatherCondition: WeatherCondition;
}

export interface TripPlanSnapshot {
  readonly snapshotId: string;
  readonly schemaVersion: 1;
  readonly trip: Trip;
  readonly userSelections: readonly UserPlaceSelection[];
  readonly selectedBundleCourseIds: readonly string[];
  readonly accommodationChoice: AccommodationAreaRecommendation;
  readonly routeDraft: readonly RouteDraft[];
  readonly mapCandidates: readonly MapCandidate[];
  readonly savedAt: string;
  readonly source: "sample";
}
