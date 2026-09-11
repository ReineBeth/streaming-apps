import { describe, expect, it } from "vitest";

import { buildDiscoverParams } from "@/lib/tmdb/discovery";

describe("buildDiscoverParams", () => {
  it("builds Canadian Quebec discovery filters without dropping provider filters", () => {
    expect(buildDiscoverParams([2303, 240], 2, {
      originalLanguage: "fr",
      originCountry: "CA",
      keywordIds: [123, 456],
      peopleIds: [42],
      castIds: [84, 85],
      crewIds: [126],
      companyIds: [168],
      genreId: 18,
      year: 2025,
      minRating: 6,
      sortBy: "popularity.desc",
    })).toEqual({
      page: 2,
      language: "fr-CA",
      watch_region: "CA",
      with_watch_providers: "2303|240",
      with_watch_monetization_types: "flatrate|free|ads",
      with_genres: 18,
      primary_release_year: 2025,
      first_air_date_year: undefined,
      "vote_average.gte": 6,
      sort_by: "popularity.desc",
      with_original_language: "fr",
      with_origin_country: "CA",
      with_keywords: "123|456",
      with_people: "42",
      with_cast: "84|85",
      with_crew: "126",
      with_companies: "168",
    });
  });

  it("uses paid or all monetization categories when requested", () => {
    expect(buildDiscoverParams([], 1, { cost: "paid" }).with_watch_monetization_types).toBe("rent|buy");
    expect(buildDiscoverParams([], 1, { cost: "all" }).with_watch_monetization_types).toBe("flatrate|free|ads|rent|buy");
  });
});
