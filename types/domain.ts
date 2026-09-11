export const mediaTypes = ["movie", "tv"] as const;
export type MediaType = (typeof mediaTypes)[number];

export const costFilters = ["free", "paid", "all"] as const;
export type CostFilter = (typeof costFilters)[number];

export const titleStatuses = [
  "to_watch",
  "in_progress",
  "watched",
  "abandoned",
  "not_interested",
] as const;
export type TitleStatus = (typeof titleStatuses)[number];

export const personalRatingLabels = ["bad", "okay", "good", "very_good", "masterpiece"] as const;
export type PersonalRating = (typeof personalRatingLabels)[number];

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
  isPaid: boolean;
  audioLanguages: string[] | null;
}

export interface TitleCredit {
  id: number;
  name: string;
  character: string | null;
  job: string | null;
  profilePath: string | null;
}

export interface TitleCompany {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string | null;
}

export interface CatalogTitleSummary {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  year: number | null;
  posterPath: string | null;
  tmdbRating: number | null;
  languages: string[];
  providers: WatchProvider[];
  status: TitleStatus | null;
  personalRating: PersonalRating | null;
  seasonRatings: Array<{ seasonNumber: number; rating: PersonalRating }>;
  recommendationReason?: string;
}
