import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

export type EnrichableTitle = TmdbMovie | TmdbTvShow;

export function titleKey(title: EnrichableTitle): string {
  return `${"title" in title ? "movie" : "tv"}:${title.id}`;
}

export function deduplicateTitles(titles: EnrichableTitle[]): EnrichableTitle[] {
  return Array.from(new Map(titles.map((title) => [titleKey(title), title])).values());
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  if (limit < 1) throw new Error("Concurrency limit must be positive");

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
