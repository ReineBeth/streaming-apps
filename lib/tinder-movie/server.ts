import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SharedSessionFilters, SharedSessionTitle } from "@/lib/tinder-movie/session";
import { discoverMovies, discoverTvShows } from "@/lib/tmdb/catalog";
import { getActiveTmdbProviderIds } from "@/lib/streaming-services";
import type { MediaType, PersonalRating } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

export type SharedSessionPayload = {
  session: { id: string; filters: SharedSessionFilters; expires_at: string };
  participant: { id: string; display_name: string };
  participants: Array<{ id: string; display_name: string; completed: boolean }>;
  titles: SharedSessionTitle[];
  votes: Array<{ participant_id: string; tmdb_id: number; media_type: MediaType; liked: boolean }>;
};

const RATING_ORDER: PersonalRating[] = ["bad", "okay", "good", "very_good", "masterpiece"];

export async function getSharedMovieSession(accessToken: string, participantToken: string): Promise<SharedSessionPayload | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_shared_movie_session", {
    p_access_token: accessToken,
    p_participant_token: participantToken,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as unknown as SharedSessionPayload;
}

export async function createSharedSessionTitles(filters: SharedSessionFilters): Promise<SharedSessionTitle[]> {
  const providerIds = await getActiveTmdbProviderIds();
  if (providerIds.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data: personalTitles, error } = await supabase.from("user_titles").select("tmdb_id, media_type, status, rating_label");
  if (error) throw new Error("Unable to load personal title filters");

  const personalState = new Map((personalTitles ?? []).map((title) => [`${title.media_type}:${title.tmdb_id}`, title]));
  const mediaTypes: MediaType[] = filters.type === "all" ? ["movie", "tv"] : [filters.type];
  const discoverPage = async (mediaType: MediaType, page: number): Promise<Array<TmdbMovie | TmdbTvShow>> => {
    if (mediaType === "movie") return (await discoverMovies(providerIds, page, { genreId: filters.genreId ?? undefined, sortBy: "popularity.desc" })).results;
    return (await discoverTvShows(providerIds, page, { genreId: filters.genreId ?? undefined, sortBy: "popularity.desc" })).results;
  };
  const responses = await Promise.all(mediaTypes.flatMap((mediaType) => [1, 2].map((page) => discoverPage(mediaType, page))));

  const titles = responses.flat().map((title) => {
    const mediaType: MediaType = "title" in title ? "movie" : "tv";
    const displayTitle = mediaType === "movie" ? (title as TmdbMovie).title : (title as TmdbTvShow).name;
    const releaseDate = mediaType === "movie" ? (title as TmdbMovie).release_date : (title as TmdbTvShow).first_air_date;
    return {
      tmdbId: title.id,
      mediaType,
      title: displayTitle,
      position: 0,
      overview: title.overview ?? "",
      year: Number.parseInt(releaseDate.slice(0, 4), 10) || null,
      posterPath: title.poster_path,
      tmdbRating: Number.isFinite(title.vote_average) ? title.vote_average : null,
      state: personalState.get(`${mediaType}:${title.id}`),
    };
  });

  const filtered = titles.filter((title) => {
    if (filters.status && title.state?.status !== filters.status) return false;
    if (!filters.minRating) return true;
    const rating = title.state?.rating_label as PersonalRating | null | undefined;
    return rating ? RATING_ORDER.indexOf(rating) >= RATING_ORDER.indexOf(filters.minRating) : false;
  });

  const unique = new Map(filtered.map((title) => [`${title.mediaType}:${title.tmdbId}`, title]));
  return Array.from(unique.values()).slice(0, 10).map((title, index) => ({
    tmdbId: title.tmdbId,
    mediaType: title.mediaType,
    title: title.title,
    position: index,
    overview: title.overview,
    year: title.year,
    posterPath: title.posterPath,
    tmdbRating: title.tmdbRating,
  }));
}
