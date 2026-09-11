import "server-only";

import { getMovie, getRecommendations, getTvShow, getWatchProviders } from "@/lib/tmdb/catalog";
import { rankRecommendationCandidates, type RecommendationCandidate } from "@/lib/recommendation-ranking";
import type { CatalogTitleSummary, MediaType, PersonalRating, WatchProvider } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

interface PersonalTitleSeed {
  tmdb_id: number;
  media_type: MediaType;
  status: string;
  rating_label: PersonalRating | null;
}

const ratingWeights: Partial<Record<PersonalRating, number>> = {
  good: 2,
  very_good: 3,
  masterpiece: 4,
};

function getRatingWeight(rating: PersonalRating | null): number {
  return rating ? ratingWeights[rating] ?? 0 : 0;
}

function seedCandidates(seed: PersonalTitleSeed, index: number): Promise<RecommendationCandidate[]> {
  const weight = seed.status === "to_watch" ? 1 : getRatingWeight(seed.rating_label);
  if (weight === 0) return Promise.resolve([]);
  return Promise.all([
    seed.media_type === "movie" ? getMovie(seed.tmdb_id) : getTvShow(seed.tmdb_id),
    getRecommendations(seed.tmdb_id, seed.media_type),
  ]).then(([source, response]) => {
    const sourceName = "title" in source ? source.title : source.name;
    const reason = seed.status === "to_watch" ? "Proche de ta liste à voir" : `Parce que tu as aimé « ${sourceName} »`;
    return response.results.slice(0, 12).map((title, recommendationIndex) => ({
      tmdbId: title.id,
      mediaType: seed.media_type,
      score: weight * (12 - recommendationIndex) + Math.max(0, 3 - index),
      reason,
    }));
  });
}

function toSummary(title: TmdbMovie | TmdbTvShow, providers: WatchProvider[], recommendationReason: string | undefined): CatalogTitleSummary {
  const isMovie = "title" in title;
  const date = isMovie ? title.release_date : title.first_air_date;
  return {
    tmdbId: title.id,
    mediaType: isMovie ? "movie" : "tv",
    title: isMovie ? title.title : title.name,
    overview: title.overview,
    year: Number.parseInt(date.slice(0, 4), 10) || null,
    posterPath: title.poster_path,
    tmdbRating: title.vote_average || null,
    languages: title.original_language ? [title.original_language] : [],
    providers,
    status: null,
    personalRating: null,
    seasonRatings: [],
    recommendationReason,
  };
}

export async function getPersonalizedRecommendations(seeds: PersonalTitleSeed[], activeProviderIds: number[], excluded: Set<string>): Promise<CatalogTitleSummary[]> {
  const usableSeeds = seeds.filter((seed) => seed.status === "to_watch" || getRatingWeight(seed.rating_label) > 0);
  const candidateResults = await Promise.allSettled(usableSeeds.slice(0, 8).map(seedCandidates));
  const candidateLists = candidateResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const ranked = rankRecommendationCandidates(candidateLists.flat(), excluded).slice(0, 18);
  const recommendations = await Promise.allSettled(ranked.map(async (candidate) => {
    const title = candidate.mediaType === "movie" ? await getMovie(candidate.tmdbId) : await getTvShow(candidate.tmdbId);
    const providers = (await getWatchProviders(candidate.tmdbId, candidate.mediaType)).filter((provider) => activeProviderIds.includes(provider.id));
    return providers.length > 0 ? toSummary(title, providers, candidate.reason) : null;
  }));
  return recommendations.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []).slice(0, 18);
}
