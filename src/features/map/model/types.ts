export type MapCandidateType =
  | "interest"
  | "nearby"
  | "rainy_day"
  | "rest"
  | "cafe"
  | "food"
  | "shopping";

export type WeatherCondition = "any" | "clear" | "rain" | "hot" | "evening";

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
