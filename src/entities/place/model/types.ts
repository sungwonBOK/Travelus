import type { TimeBlock } from "@/entities/trip/model/types";

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

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
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
