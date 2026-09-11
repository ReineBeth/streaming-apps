import type { CatalogTitleSummary } from "@/types/domain";

export type WatchlistType = "all" | "movie" | "tv";

export interface WatchlistFilters {
  type: WatchlistType;
  serviceId: number | null;
  genreId: number | null;
  page: number;
}

export interface WatchlistFilterableTitle extends CatalogTitleSummary {
  genreIds: number[];
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : null;
}

export function parseWatchlistFilters(params: Record<string, string | string[] | undefined>): WatchlistFilters {
  const type = firstParam(params.type);
  const page = positiveInteger(firstParam(params.page));
  return {
    type: type === "movie" || type === "tv" ? type : "all",
    serviceId: positiveInteger(firstParam(params.service)),
    genreId: positiveInteger(firstParam(params.genre)),
    page: page ?? 1,
  };
}

export function matchesWatchlistFilters(title: WatchlistFilterableTitle, filters: WatchlistFilters): boolean {
  return (filters.type === "all" || title.mediaType === filters.type)
    && (!filters.serviceId || title.providers.some((provider) => provider.id === filters.serviceId))
    && (!filters.genreId || title.genreIds.includes(filters.genreId));
}
