import type { CatalogTitleSummary } from "@/types/domain";

export function getTitleKey(title: Pick<CatalogTitleSummary, "mediaType" | "tmdbId">): string {
  return `${title.mediaType}:${title.tmdbId}`;
}

export function pickRandomTitle(
  candidates: CatalogTitleSummary[],
  drawnIds: ReadonlySet<string>,
  random = Math.random,
): CatalogTitleSummary | null {
  const available = candidates.filter((candidate) => !drawnIds.has(getTitleKey(candidate)));

  if (available.length === 0) return null;

  return available[Math.floor(random() * available.length)] ?? null;
}
