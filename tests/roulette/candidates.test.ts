import { describe, expect, it } from "vitest";

import { filterCandidatesByStatus, toRouletteSummary, type RouletteStatusFilter } from "@/lib/roulette/candidate-filters";
import type { CatalogTitleSummary } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

function catalogTitle(status: CatalogTitleSummary["status"]): CatalogTitleSummary {
  return {
    tmdbId: 1,
    mediaType: "movie",
    title: "Titre",
    overview: "Résumé",
    year: 2024,
    posterPath: "/poster.jpg",
    tmdbRating: 8.2,
    languages: ["fr"],
    providers: [],
    status,
    personalRating: null,
    seasonRatings: [],
  };
}

describe("roulette candidates", () => {
  it.each<[RouletteStatusFilter, CatalogTitleSummary["status"]]>([
    ["empty", null],
    ["watched", "watched"],
    ["to_watch", "to_watch"],
  ])("filters candidates with status %s", (filter, matchingStatus) => {
    const candidates = [catalogTitle(matchingStatus), catalogTitle(matchingStatus === null ? "watched" : null)];

    expect(filterCandidatesByStatus(candidates, filter)).toHaveLength(1);
    expect(filterCandidatesByStatus(candidates, filter)[0].status).toBe(matchingStatus);
  });

  it("keeps every status when no status filter is selected", () => {
    expect(filterCandidatesByStatus([catalogTitle(null), catalogTitle("watched")], null)).toHaveLength(2);
  });

  it("maps a TMDB movie to the reduced roulette summary", () => {
    const movie: TmdbMovie = {
      id: 42,
      title: "Un film",
      overview: "Résumé du film",
      poster_path: "/film.jpg",
      release_date: "2024-05-01",
      vote_average: 7.5,
      original_language: "fr",
      genre_ids: [18],
      media_type: "movie",
      backdrop_path: null,
    };

    expect(toRouletteSummary(movie, "movie")).toEqual(expect.objectContaining({
      tmdbId: 42,
      mediaType: "movie",
      title: "Un film",
      year: 2024,
      posterPath: "/film.jpg",
      tmdbRating: 7.5,
      languages: ["fr"],
      providers: [],
    }));
  });

  it("maps a TMDB series to the reduced roulette summary", () => {
    const show: TmdbTvShow = {
      id: 43,
      name: "Une série",
      overview: "Résumé de la série",
      poster_path: null,
      first_air_date: "2023-01-01",
      vote_average: 8,
      original_language: "en",
      genre_ids: [18],
      media_type: "tv",
      backdrop_path: null,
      origin_country: ["CA"],
    };

    expect(toRouletteSummary(show, "tv")).toEqual(expect.objectContaining({
      tmdbId: 43,
      mediaType: "tv",
      title: "Une série",
      year: 2023,
      posterPath: null,
      tmdbRating: 8,
      languages: ["en"],
      providers: [],
    }));
  });
});
