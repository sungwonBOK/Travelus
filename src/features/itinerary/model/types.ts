import type { DifficultyLevel } from "@/entities/place/model/types";
import type { DestinationId, TimeBlock } from "@/entities/trip/model/types";

export type BundleCourseType = "full_day" | "half_day" | "food_route";

export type RouteItemType = "place" | "bundle_course" | "free_time" | "meal";

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
