import type { MediaType, PersonalRating, TitleStatus } from "@/types/domain";

export type SharedSessionType = "all" | MediaType;

export interface SharedSessionFilters {
  type: SharedSessionType;
  genreId: number | null;
  status: TitleStatus | null;
  minRating: PersonalRating | null;
}

export interface SharedSessionTitle {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  position: number;
  overview?: string;
  year?: number | null;
  posterPath?: string | null;
  tmdbRating?: number | null;
}

export const SHARED_SESSION_TITLE_COUNT = 10;
export const SHARED_SESSION_TTL_HOURS = 24;

const VALID_STATUSES: TitleStatus[] = ["to_watch", "in_progress", "watched", "abandoned", "not_interested"];
const VALID_RATINGS: PersonalRating[] = ["bad", "okay", "good", "very_good", "masterpiece"];

export function parseSharedSessionFilters(params: Record<string, string | string[] | undefined>): SharedSessionFilters {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const genreId = Number.parseInt(first(params.genre), 10);
  const type = first(params.type);
  const status = first(params.status);
  const minRating = first(params.minRating);

  return {
    type: type === "movie" || type === "tv" ? type : "all",
    genreId: Number.isInteger(genreId) && genreId > 0 ? genreId : null,
    status: VALID_STATUSES.includes(status as TitleStatus) ? status as TitleStatus : null,
    minRating: VALID_RATINGS.includes(minRating as PersonalRating) ? minRating as PersonalRating : null,
  };
}

export function getCommonTitleKeys(
  titles: SharedSessionTitle[],
  firstLikes: Set<string>,
  secondLikes: Set<string>,
): string[] {
  return titles
    .filter((title) => {
      const key = `${title.mediaType}:${title.tmdbId}`;
      return firstLikes.has(key) && secondLikes.has(key);
    })
    .sort((first, second) => first.position - second.position)
    .map((title) => `${title.mediaType}:${title.tmdbId}`);
}
