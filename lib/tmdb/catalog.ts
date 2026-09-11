import "server-only";

import { tmdbRequest } from "@/lib/tmdb/client";
import { buildDiscoverParams, type DiscoverOptions } from "@/lib/tmdb/discovery";
import { mapCanadianWatchProviders } from "@/lib/tmdb/providers";
import type { MediaType, WatchProvider } from "@/types/domain";
import type {
  TmdbDiscoverResponse,
  TmdbCompanySearchResponse,
  TmdbCredits,
  TmdbGenre,
  TmdbMovie,
  TmdbPersonSearchResponse,
  TmdbSearchResponse,
  TmdbTvShow,
  TmdbWatchProvidersResponse,
} from "@/types/tmdb";

const CANADA = "CA";

export function getMovie(tmdbId: number): Promise<TmdbMovie> {
  return tmdbRequest<TmdbMovie>(`/movie/${tmdbId}`, { language: "fr-CA", append_to_response: "credits" });
}

export function getTvShow(tmdbId: number): Promise<TmdbTvShow> {
  return tmdbRequest<TmdbTvShow>(`/tv/${tmdbId}`, { language: "fr-CA", append_to_response: "credits" });
}

export function getGenres(mediaType: MediaType): Promise<{ genres: TmdbGenre[] }> {
  return tmdbRequest<{ genres: TmdbGenre[] }>(`/genre/${mediaType}/list`, { language: "fr-CA" });
}

export function searchTitles(query: string, page = 1): Promise<TmdbSearchResponse> {
  return tmdbRequest<TmdbSearchResponse>("/search/multi", {
    query,
    page,
    language: "fr-CA",
    include_adult: "false",
  });
}

export function searchPeople(query: string, page = 1): Promise<TmdbPersonSearchResponse> {
  return tmdbRequest<TmdbPersonSearchResponse>("/search/person", {
    query,
    page,
    language: "fr-CA",
    include_adult: "false",
  });
}

export function searchCompanies(query: string, page = 1): Promise<TmdbCompanySearchResponse> {
  return tmdbRequest<TmdbCompanySearchResponse>("/search/company", { query, page });
}

export function getCredits(tmdbId: number, mediaType: MediaType): Promise<TmdbCredits> {
  const path = mediaType === "movie" ? `/movie/${tmdbId}/credits` : `/tv/${tmdbId}/credits`;
  return tmdbRequest<TmdbCredits>(path, { language: "fr-CA" });
}

export function discoverMovies(providerIds: number[] = [], page = 1, options: DiscoverOptions = {}): Promise<TmdbDiscoverResponse<TmdbMovie>> {
  return tmdbRequest<TmdbDiscoverResponse<TmdbMovie>>("/discover/movie", buildDiscoverParams(providerIds, page, options, "movie"));
}

export function discoverTvShows(providerIds: number[] = [], page = 1, options: DiscoverOptions = {}): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
  return tmdbRequest<TmdbDiscoverResponse<TmdbTvShow>>("/discover/tv", buildDiscoverParams(providerIds, page, options, "tv"));
}

export function getRecommendations(tmdbId: number, mediaType: MediaType): Promise<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>> {
  const path = mediaType === "movie" ? `/movie/${tmdbId}/recommendations` : `/tv/${tmdbId}/recommendations`;
  return tmdbRequest<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>>(path, { language: "fr-CA", page: 1 });
}

export async function getWatchProviders(tmdbId: number, mediaType: MediaType): Promise<WatchProvider[]> {
  const path = mediaType === "movie" ? `/movie/${tmdbId}/watch/providers` : `/tv/${tmdbId}/watch/providers`;
  const response = await tmdbRequest<TmdbWatchProvidersResponse>(path);

  return mapCanadianWatchProviders(response, CANADA);
}
