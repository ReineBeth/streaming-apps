import { describe, expect, it } from "vitest";

import { matchesWatchlistFilters, parseWatchlistFilters, type WatchlistFilterableTitle } from "@/lib/watchlist/filters";

const title: WatchlistFilterableTitle = {
  tmdbId: 1,
  mediaType: "movie",
  title: "Film",
  overview: "",
  year: 2024,
  posterPath: null,
  tmdbRating: 8,
  languages: ["fr"],
  providers: [{ id: 2303, name: "Crave", logoPath: null, isPaid: false, audioLanguages: null }],
  genreIds: [35, 12],
  status: "to_watch",
  personalRating: null,
  seasonRatings: [],
};

describe("watchlist filters", () => {
  it("parses type, service and genre from query params", () => {
    expect(parseWatchlistFilters({ type: "movie", service: "2303", genre: "35", page: "2" })).toEqual({ type: "movie", serviceId: 2303, genreId: 35, page: 2 });
    expect(parseWatchlistFilters({ type: "invalid", service: "-1", genre: "nope" })).toEqual({ type: "all", serviceId: null, genreId: null, page: 1 });
  });

  it("matches all selected filters", () => {
    expect(matchesWatchlistFilters(title, { type: "movie", serviceId: 2303, genreId: 35, page: 1 })).toBe(true);
    expect(matchesWatchlistFilters(title, { type: "tv", serviceId: 2303, genreId: 35, page: 1 })).toBe(false);
    expect(matchesWatchlistFilters(title, { type: "all", serviceId: 999, genreId: null, page: 1 })).toBe(false);
  });
});
