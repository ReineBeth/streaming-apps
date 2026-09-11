import type { CatalogTitleSummary, MediaType, TitleStatus } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

export type RouletteStatusFilter = TitleStatus | "empty" | null;

export function filterCandidatesByStatus(
  candidates: CatalogTitleSummary[],
  status: RouletteStatusFilter,
): CatalogTitleSummary[] {
  if (status === null) return candidates;
  if (status === "empty") return candidates.filter((candidate) => candidate.status === null);
  return candidates.filter((candidate) => candidate.status === status);
}

export function toRouletteSummary(
  title: TmdbMovie | TmdbTvShow,
  mediaType: MediaType,
): CatalogTitleSummary {
  const isMovie = mediaType === "movie";
  const releaseDate = isMovie ? (title as TmdbMovie).release_date : (title as TmdbTvShow).first_air_date;
  const displayTitle = isMovie ? (title as TmdbMovie).title : (title as TmdbTvShow).name;

  return {
    tmdbId: title.id,
    mediaType,
    title: displayTitle,
    overview: title.overview ?? "",
    year: Number.parseInt(releaseDate.slice(0, 4), 10) || null,
    posterPath: title.poster_path,
    tmdbRating: Number.isFinite(title.vote_average) ? title.vote_average : null,
    languages: title.original_language ? [title.original_language] : [],
    providers: [],
    status: null,
    personalRating: null,
    seasonRatings: [],
  };
}
