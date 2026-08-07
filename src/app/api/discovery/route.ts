import { NextRequest, NextResponse } from "next/server";

import { searchCountryCandidates } from "../../../features/discovery/model/discovery-service";
import { createGooglePlacesProvider } from "../../../features/discovery/model/google-places-provider";
import { ProviderUnavailableError } from "../../../features/discovery/model/place-search-provider";

import type { PlaceSearchProvider } from "../../../features/discovery/model/place-search-provider";

interface DiscoveryRouteDependencies {
  readonly provider?: PlaceSearchProvider;
}

interface DiscoveryRouteDependencyOptions {
  readonly apiKey?: string;
  readonly provider?: PlaceSearchProvider;
}

export function createDiscoveryRouteDependencies(
  options: DiscoveryRouteDependencyOptions = {},
): DiscoveryRouteDependencies {
  const apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_API_KEY;

  return {
    provider: options.provider ?? (
      apiKey ? createGooglePlacesProvider({ apiKey }) : undefined
    ),
  };
}

export async function handleDiscoveryRequest(
  request: NextRequest,
  dependencies: DiscoveryRouteDependencies,
): Promise<NextResponse> {
  if (!dependencies.provider) {
    return NextResponse.json(
      { error: "Live discovery is not configured" },
      { status: 503 },
    );
  }

  try {
    const candidates = await searchCountryCandidates(
      {
        countryCode: request.nextUrl.searchParams.get("countryCode") ?? "",
        countryName: request.nextUrl.searchParams.get("countryName") ?? "",
        query: request.nextUrl.searchParams.get("query") ?? "",
      },
      dependencies.provider,
    );

    return NextResponse.json({ candidates });
  } catch (error) {
    if (error instanceof ProviderUnavailableError) {
      return NextResponse.json(
        { error: "Discovery provider is unavailable" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Invalid discovery request" },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleDiscoveryRequest(request, createDiscoveryRouteDependencies());
}
