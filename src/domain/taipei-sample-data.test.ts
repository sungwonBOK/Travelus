import {
  taipeiAccommodationAreas,
  taipeiBundleCourses,
  taipeiMapCandidates,
  taipeiPlaces,
  taipeiRouteDraft,
  taipeiTrip,
  taipeiTripPlanSnapshot,
  taipeiUserSelections,
} from "./taipei-sample-data";

import type {
  AccommodationAreaRecommendation,
  BundleCourse,
  MapCandidate,
  Place,
  RouteDraft,
  Trip,
  TripPlanSnapshot,
  UserPlaceSelection,
} from "./types";

type Expect<T extends true> = T;

type PlaceId = (typeof taipeiPlaces)[number]["placeId"];
type CourseId = (typeof taipeiBundleCourses)[number]["courseId"];
type CandidateType = (typeof taipeiMapCandidates)[number]["candidateType"];
type RouteDay = (typeof taipeiRouteDraft)[number]["day"];

type CorePlaceIds =
  | "taipei-101-observatory"
  | "longshan-temple"
  | "shilin-night-market"
  | "yehliu-geopark"
  | "jiufen-old-street";

const corePlacesExist: Expect<CorePlaceIds extends PlaceId ? true : false> = true;
const dayTripBundleExists: Expect<
  "yehliu-shifen-jiufen-day" extends CourseId ? true : false
> = true;
const mapCandidateMixExists: Expect<
  "interest" | "nearby" | "rainy_day" extends CandidateType ? true : false
> = true;
const fourDayRouteExists: Expect<1 | 2 | 3 | 4 extends RouteDay ? true : false> =
  true;

const trip: Trip = taipeiTrip;
const places: readonly Place[] = taipeiPlaces;
const selections: readonly UserPlaceSelection[] = taipeiUserSelections;
const courses: readonly BundleCourse[] = taipeiBundleCourses;
const accommodationAreas: readonly AccommodationAreaRecommendation[] =
  taipeiAccommodationAreas;
const routeDraft: readonly RouteDraft[] = taipeiRouteDraft;
const mapCandidates: readonly MapCandidate[] = taipeiMapCandidates;
const snapshot: TripPlanSnapshot = taipeiTripPlanSnapshot;

void {
  trip,
  places,
  selections,
  courses,
  accommodationAreas,
  routeDraft,
  mapCandidates,
  snapshot,
  corePlacesExist,
  dayTripBundleExists,
  mapCandidateMixExists,
  fourDayRouteExists,
};
