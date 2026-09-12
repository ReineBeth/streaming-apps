import { describe, expect, it } from "vitest";

import { getCommonTitleKeys, parseSharedSessionFilters, type SharedSessionTitle } from "@/lib/tinder-movie/session";

describe("shared movie session", () => {
  it("keeps only titles liked by both participants", () => {
    const titles: SharedSessionTitle[] = [
      { tmdbId: 1, mediaType: "movie", title: "One", position: 0 },
      { tmdbId: 2, mediaType: "tv", title: "Two", position: 1 },
    ];

    expect(getCommonTitleKeys(titles, new Set(["movie:1"]), new Set(["movie:1", "tv:2"]))).toEqual(["movie:1"]);
  });

  it("normalizes supported session filters", () => {
    expect(parseSharedSessionFilters({ type: "tv", genre: "18", status: "watched", minRating: "good" })).toEqual({
      type: "tv",
      genreId: 18,
      status: "watched",
      minRating: "good",
    });
  });

  it("rejects unsupported values and invalid genres", () => {
    expect(parseSharedSessionFilters({ type: "music", genre: "-1", status: "unknown", minRating: "10" })).toEqual({
      type: "all",
      genreId: null,
      status: null,
      minRating: null,
    });
  });
});
