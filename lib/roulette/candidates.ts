import "server-only";

import { getActiveTmdbProviderIds } from "@/lib/streaming-services";
import { discoverMovies, discoverTvShows } from "@/lib/tmdb/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { filterCandidatesByStatus, toRouletteSummary, type RouletteStatusFilter } from "@/lib/roulette/candidate-filters";
import type { CatalogTitleSummary, MediaType, TitleStatus } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

export type RouletteTypeFilter = "all" | MediaType;

export interface RouletteFilters {
  type: RouletteTypeFilter;
  genreId: number | null;
  minRating: number | null;
  status: RouletteStatusFilter;
}

type PersonalTitleState = {
  tmdb_id: number;
  media_type: MediaType;
  status: TitleStatus;
};

export async function getRouletteCandidates(filters: RouletteFilters): Promise<CatalogTitleSummary[]> {
  const providerIds = await getActiveTmdbProviderIds();
  if (providerIds.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data: personalTitles, error } = await supabase
    .from("user_titles")
    .select("tmdb_id, media_type, status");

  if (error) throw new Error("Unable to load personal title statuses");

  const personalState = new Map(
    ((personalTitles ?? []) as PersonalTitleState[]).map((item) => [
      `${item.media_type}:${item.tmdb_id}`,
      item.status,
    ]),
  );

  const mediaTypes: MediaType[] = filters.type === "all" ? ["movie", "tv"] : [filters.type];
  const results = await Promise.all(mediaTypes.map(async (mediaType) => {
    const options = {
      genreId: filters.genreId ?? undefined,
      minRating: filters.minRating ?? undefined,
      sortBy: "popularity.desc",
    };
    const response = mediaType === "movie"
      ? await discoverMovies(providerIds, 1, options)
      : await discoverTvShows(providerIds, 1, options);

    return response.results.map((title) => withPersonalState(title, mediaType, personalState));
  }));

  return filterCandidatesByStatus(results.flat(), filters.status);
}

function withPersonalState(
  title: TmdbMovie | TmdbTvShow,
  mediaType: MediaType,
  personalState: Map<string, TitleStatus>,
): CatalogTitleSummary {
  const summary = toRouletteSummary(title, mediaType);
  return {
    ...summary,
    status: personalState.get(`${mediaType}:${title.id}`) ?? null,
  };
}
