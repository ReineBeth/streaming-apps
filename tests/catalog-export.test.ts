import { describe, expect, it } from "vitest";

import { catalogTitlesToCsv } from "@/lib/catalog-export";
import { getExportPageNumbers, MAX_EXPORT_TITLES } from "@/lib/catalog-export-limits";
import type { CatalogTitleSummary } from "@/types/domain";

const title: CatalogTitleSummary = {
  tmdbId: 97546,
  mediaType: "tv",
  title: "Ted Lasso, saison 1",
  overview: "",
  year: 2020,
  posterPath: null,
  tmdbRating: 8.4,
  languages: ["en"],
  providers: [{ id: 350, name: "Apple TV+", logoPath: null, isPaid: false, audioLanguages: null }],
  status: null,
  personalRating: null,
  seasonRatings: [],
};

describe("catalogTitlesToCsv", () => {
  it("creates one row per title and provider with empty language fields", () => {
    expect(catalogTitlesToCsv([title])).toBe([
      "tmdb_id,media_type,title,year,original_language,provider_id,provider_name,audio_languages,subtitle_languages",
      "97546,tv,\"Ted Lasso, saison 1\",2020,en,350,Apple TV+,,",
    ].join("\r\n") + "\r\n");
  });
});

describe("catalog export limits", () => {
  it("caps TMDB pagination to the documented title limit", () => {
    expect(getExportPageNumbers(500)).toHaveLength(MAX_EXPORT_TITLES / 20);
    expect(getExportPageNumbers(3)).toEqual([1, 2, 3]);
    expect(getExportPageNumbers(Number.NaN)).toEqual([1]);
  });
});
