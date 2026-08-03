export type SelectionType = "must_go" | "interested" | "excluded";

export interface UserPlaceSelection {
  readonly selectionId: string;
  readonly tripId: string;
  readonly placeId: string;
  readonly selectionType: SelectionType;
  readonly priority: number;
  readonly userNote?: string;
}
