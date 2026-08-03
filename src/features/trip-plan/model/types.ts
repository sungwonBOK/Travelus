import type { Trip, TravelStyle } from "@/entities/trip/model/types";
import type { RouteDraft } from "@/features/itinerary/model/types";
import type { MapCandidate } from "@/features/map/model/types";
import type { UserPlaceSelection } from "@/features/recommendations/model/types";

export interface AccommodationAreaRecommendation {
  readonly areaId: string;
  readonly destination: Trip["destination"]["destinationId"];
  readonly name: string;
  readonly summary: string;
  readonly averageAccessScore: number;
  readonly airportStationAccessScore: number;
  readonly nightReturnConvenienceScore: number;
  readonly beginnerSuitabilityScore: number;
  readonly travelStyleFit: readonly TravelStyle[];
  readonly recommendedReason: string;
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
