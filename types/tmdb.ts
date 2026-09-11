export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface TmdbWatchProviderRegion {
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  link?: string;
}

export interface TmdbWatchProvidersResponse {
  results?: Record<string, TmdbWatchProviderRegion>;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbPersonSearchResult {
  id: number;
  name: string;
  known_for_department?: string;
  profile_path: string | null;
}

export interface TmdbPerson {
  id: number;
  name: string;
  known_for_department?: string;
  profile_path: string | null;
  media_type: "person";
}

export interface TmdbCompanySearchResult {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

export interface TmdbPersonSearchResponse {
  results: TmdbPersonSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbCompanySearchResponse {
  results: TmdbCompanySearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  order?: number;
  profile_path: string | null;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path: string | null;
}

export interface TmdbCredits {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  original_language?: string;
  origin_country?: string[];
  genre_ids?: number[];
  genres?: TmdbGenre[];
  production_companies?: TmdbProductionCompany[];
  credits?: TmdbCredits;
  runtime?: number | null;
  media_type?: "movie";
}

export interface TmdbTvShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  original_language?: string;
  origin_country?: string[];
  genre_ids?: number[];
  genres?: TmdbGenre[];
  production_companies?: TmdbProductionCompany[];
  credits?: TmdbCredits;
  number_of_seasons?: number;
  seasons?: TmdbSeason[];
  media_type?: "tv";
}

export interface TmdbSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

export interface TmdbSearchResponse {
  results: Array<(TmdbMovie | TmdbTvShow | TmdbPerson) & { media_type: "movie" | "tv" | "person" }>;
  total_pages: number;
  total_results: number;
}

export interface TmdbDiscoverResponse<T> {
  results: T[];
  total_pages: number;
  total_results: number;
}
