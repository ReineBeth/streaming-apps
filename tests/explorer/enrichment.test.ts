import { describe, expect, it } from "vitest";

import { deduplicateTitles, mapWithConcurrency } from "@/lib/explorer/enrichment";
import type { TmdbMovie } from "@/types/tmdb";

const movie = (id: number): TmdbMovie => ({
  id,
  title: `Movie ${id}`,
  overview: "",
  release_date: "2025-01-01",
  poster_path: null,
  backdrop_path: null,
  vote_average: 7,
});

describe("Explorer enrichment helpers", () => {
  it("deduplicates titles by media type and TMDB id while preserving order", () => {
    expect(deduplicateTitles([movie(1), movie(1), movie(2)]).map((item) => item.id)).toEqual([1, 2]);
  });

  it("keeps concurrent enrichment within the configured limit", async () => {
    let active = 0;
    let peak = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBeLessThanOrEqual(2);
  });
});
