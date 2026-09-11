import type { CostFilter, MediaType } from "@/types/domain";

export interface DiscoverOptions {
  genreId?: number;
  year?: number;
  minRating?: number;
  sortBy?: string;
  originalLanguage?: string;
  originCountry?: string;
  keywordIds?: number[];
  peopleIds?: number[];
  castIds?: number[];
  crewIds?: number[];
  companyIds?: number[];
  cost?: CostFilter;
}

function getWatchMonetizationTypes(cost: CostFilter = "free"): string {
  if (cost === "paid") return "rent|buy";
  if (cost === "all") return "flatrate|free|ads|rent|buy";
  return "flatrate|free|ads";
}

export function buildDiscoverParams(
  providerIds: number[],
  page: number,
  options: DiscoverOptions,
  mediaType: MediaType = "movie",
): Record<string, string | number | undefined> {
  return {
    page,
    language: "fr-CA",
    watch_region: "CA",
    with_watch_providers: providerIds.length > 0 ? providerIds.join("|") : undefined,
    with_watch_monetization_types: getWatchMonetizationTypes(options.cost),
    with_genres: options.genreId,
    primary_release_year: mediaType === "movie" ? options.year : undefined,
    first_air_date_year: mediaType === "tv" ? options.year : undefined,
    "vote_average.gte": options.minRating,
    sort_by: options.sortBy ?? "popularity.desc",
    with_original_language: options.originalLanguage,
    with_origin_country: options.originCountry,
    with_keywords: options.keywordIds?.length ? options.keywordIds.join("|") : undefined,
    with_people: options.peopleIds?.length ? options.peopleIds.join("|") : undefined,
    with_cast: options.castIds?.length ? options.castIds.join("|") : undefined,
    with_crew: options.crewIds?.length ? options.crewIds.join("|") : undefined,
    with_companies: options.companyIds?.length ? options.companyIds.join("|") : undefined,
  };
}
