import type { DiscoveryCandidate } from "./types";

export interface CountrySearchInput {
  readonly countryCode: string;
  readonly countryName: string;
  readonly query: string;
}

export interface PlaceSearchProvider {
  search(input: CountrySearchInput): Promise<readonly DiscoveryCandidate[]>;
}

export class ProviderUnavailableError extends Error {
  constructor(readonly provider: string) {
    super(`${provider} is unavailable`);
  }
}
