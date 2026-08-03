export type DestinationId = "taipei";

export type TravelStyle =
  | "first_time_free_travel"
  | "food_focused"
  | "classic_landmarks"
  | "slow_paced"
  | "day_trip";

export type AccommodationStatus = "needed" | "booked" | "undecided";

export type TimeBlock =
  | "morning"
  | "lunch"
  | "afternoon"
  | "sunset"
  | "evening";

export interface Destination {
  readonly destinationId: DestinationId;
  readonly city: string;
  readonly country: string;
  readonly displayName: string;
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
