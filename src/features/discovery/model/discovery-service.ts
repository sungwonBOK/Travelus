import type {
  CountrySearchInput,
  PlaceSearchProvider,
} from "./place-search-provider";
import type { DiscoveryCandidate } from "./types";

export class CountrySearchValidationError extends Error {}

export async function searchCountryCandidates(
  input: CountrySearchInput,
  provider: PlaceSearchProvider,
): Promise<readonly DiscoveryCandidate[]> {
  const normalized = {
    countryCode: input.countryCode.trim().toUpperCase(),
    countryName: input.countryName.trim(),
    query: input.query.trim(),
  };

  if (!normalized.countryCode || !normalized.countryName) {
    throw new CountrySearchValidationError("Country is required");
  }
  if (normalized.query.length < 2) {
    throw new CountrySearchValidationError(
      "Search query must contain at least two characters",
    );
  }

  return provider.search(normalized);
}
