import { describe, expect, it } from "vitest";

import { rankRecommendationCandidates, type RecommendationCandidate } from "@/lib/recommendation-ranking";

const candidate = (tmdbId: number, mediaType: "movie" | "tv", score: number, reason?: string): RecommendationCandidate => ({
  tmdbId,
  mediaType,
  score,
  reason,
});

describe("rankRecommendationCandidates", () => {
  it("combines repeated recommendations and excludes titles already in the library", () => {
    const ranked = rankRecommendationCandidates([
      candidate(10, "movie", 12, "Parce que tu as aimé « Dune »"),
      candidate(20, "tv", 8),
      candidate(10, "movie", 5),
      candidate(30, "movie", 20),
    ], new Set([30]));

    expect(ranked).toEqual([
      { tmdbId: 10, mediaType: "movie", score: 17, reason: "Parce que tu as aimé « Dune »" },
      { tmdbId: 20, mediaType: "tv", score: 8, reason: undefined },
    ]);
  });
});
