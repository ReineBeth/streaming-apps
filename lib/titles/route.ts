import type { MediaType } from "@/types/domain";

export function parseTitleRoute(mediaType: string, tmdbId: string): { mediaType: MediaType; tmdbId: number } | null {
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  if (!/^\d+$/.test(tmdbId)) return null;

  const parsedId = Number.parseInt(tmdbId, 10);
  return Number.isSafeInteger(parsedId) && parsedId > 0 ? { mediaType, tmdbId: parsedId } : null;
}
