import type { MediaType } from "@/types/domain";

export interface RecommendationCandidate {
  tmdbId: number;
  mediaType: MediaType;
  score: number;
  reason?: string;
}

export function rankRecommendationCandidates(candidates: RecommendationCandidate[], excluded: Set<string | number>): RecommendationCandidate[] {
  const scores = new Map<string, RecommendationCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.mediaType}:${candidate.tmdbId}`;
    if (excluded.has(candidate.tmdbId) || excluded.has(key)) continue;
    const existing = scores.get(key);
    scores.set(key, existing ? { ...existing, score: existing.score + candidate.score } : candidate);
  }
  return [...scores.values()].sort((first, second) => second.score - first.score || first.tmdbId - second.tmdbId);
}
