import Link from "next/link";
import { TextLink } from "@/components/ui";

import { ExplorerFiltersUnified } from "@/components/explorer-filters-unified";
import { MediaCard } from "@/components/media-card";
import { Pagination } from "@/components/pagination";
import { getActiveTmdbProviderIds, getTitleProviderAudioLanguagesForTitles } from "@/lib/streaming-services";
import { deduplicateTitles, mapWithConcurrency, titleKey } from "@/lib/explorer/enrichment";
import { firstExplorerParam, matchesCostFilter, parseExplorerFilters, resolveExactPerson, type ExplorerFiltersData, type SortOption } from "@/lib/explorer/filters";
import { shouldShowPagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverMovies, discoverTvShows, getCredits, getGenres, getWatchProviders, searchCompanies, searchTitles } from "@/lib/tmdb/catalog";
import { creditsMatchPerson } from "@/lib/tmdb/details";
import { TmdbApiError } from "@/lib/tmdb/client";
import type { CatalogTitleSummary } from "@/types/domain";
import type { TmdbMovie, TmdbPerson, TmdbTvShow } from "@/types/tmdb";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";
const EXPLORER_PAGE_SIZE = 36;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function toSummary(title: TmdbMovie | TmdbTvShow, providers: CatalogTitleSummary["providers"]): CatalogTitleSummary {
  const isMovie = "title" in title;
  return { tmdbId: title.id, mediaType: isMovie ? "movie" : "tv", title: isMovie ? title.title : title.name, overview: title.overview, year: Number.parseInt((isMovie ? title.release_date : title.first_air_date).slice(0, 4), 10) || null, posterPath: title.poster_path, tmdbRating: title.vote_average || null, languages: title.original_language ? [title.original_language] : [], providers, status: null, personalRating: null, seasonRatings: [] };
}

async function enrichTitles(titles: Array<TmdbMovie | TmdbTvShow>, providerIds: number[], serviceId: number | null, cost: ExplorerFiltersData["cost"]) {
  const uniqueTitles = deduplicateTitles(titles);
  const audioLanguages = await getTitleProviderAudioLanguagesForTitles(uniqueTitles.map((title) => ({ tmdbId: title.id, mediaType: "title" in title ? "movie" : "tv" })));
  const summaries = await mapWithConcurrency(uniqueTitles, 6, async (title) => {
    const mediaType = "title" in title ? "movie" : "tv";
    const providers = await getWatchProviders(title.id, mediaType);
    const titleAudioLanguages = audioLanguages.get(titleKey(title)) ?? {};
    const availableProviders = providerIds.length === 0 ? providers : providers.filter((provider) => providerIds.includes(provider.id));
    return toSummary(title, availableProviders.map((provider) => ({ ...provider, audioLanguages: titleAudioLanguages[provider.id] ?? null })));
  });
  return summaries.filter((title) => matchesCostFilter(title.providers, cost)).filter((title) => !serviceId || title.providers.some((provider) => provider.id === serviceId));
}

async function verifyPersonMatches(titles: Array<TmdbMovie | TmdbTvShow>, filters: ExplorerFiltersData) {
  if (!filters.personId) return titles;
  const uniqueTitles = deduplicateTitles(titles);
  const matches = new Set((await mapWithConcurrency(uniqueTitles, 6, async (title) => {
    const mediaType = "title" in title ? "movie" : "tv";
    const credits = await getCredits(title.id, mediaType);
    return creditsMatchPerson(credits, filters.personId as number, filters.personRole) ? titleKey(title) : null;
  })).filter((key): key is string => key !== null));
  return titles.filter((title) => matches.has(titleKey(title)));
}

function getExplorerPageRange(page: number, sourcePageSize: number) {
  const startPage = Math.floor(((page - 1) * EXPLORER_PAGE_SIZE) / sourcePageSize) + 1;
  const endPage = Math.ceil((page * EXPLORER_PAGE_SIZE) / sourcePageSize);
  const offset = (page - 1) * EXPLORER_PAGE_SIZE - (startPage - 1) * sourcePageSize;
  return { startPage, endPage, offset };
}

async function getCatalogTitles(providerIds: number[], filters: ExplorerFiltersData) {
  if (providerIds.length === 0 && !filters.allPlatforms) return { titles: [], totalPages: 1 };

  const sourcePageSize = filters.type === "all" && !filters.query ? 40 : 20;
  const { startPage, endPage, offset } = getExplorerPageRange(filters.page, sourcePageSize);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  if (filters.query && !filters.personId && !filters.companyId) {
    const results = await Promise.all(pages.map((page) => searchTitles(filters.query, page)));
    const searchResults = results.flatMap((result) => result.results)
      .filter((title) => title.media_type === "movie" || title.media_type === "tv")
      .filter((title) => filters.type === "all" || (filters.type === "movie" ? "title" in title : "name" in title))
      .filter((title) => !filters.genreId || title.genre_ids?.includes(filters.genreId))
      .filter((title) => !filters.minRating || title.vote_average >= filters.minRating)
      .filter((title) => !filters.year || (("title" in title ? title.release_date : title.first_air_date).startsWith(String(filters.year)))) as Array<TmdbMovie | TmdbTvShow>;
    searchResults.sort((first, second) => compareTitles(first, second, filters.sort));
    const titles = await enrichTitles(searchResults, providerIds, filters.serviceId, filters.cost);
    const totalResults = results[0]?.total_results ?? 0;
    return { titles: titles.slice(offset, offset + EXPLORER_PAGE_SIZE), totalPages: Math.max(1, Math.ceil(totalResults / EXPLORER_PAGE_SIZE)) };
  }

  const discoverOptions = (mediaType: "movie" | "tv") => ({
    genreId: filters.genreId ?? undefined,
    year: filters.year ?? undefined,
    minRating: filters.minRating ?? undefined,
    sortBy: getSortBy(filters.sort, mediaType),
    cost: filters.cost,
    originalLanguage: filters.quebec ? "fr" : undefined,
    originCountry: filters.quebec ? "CA" : undefined,
    castIds: filters.personId && filters.personRole === "actor" ? [filters.personId] : undefined,
    crewIds: filters.personId && filters.personRole === "director" ? [filters.personId] : undefined,
    companyIds: filters.companyId ? [filters.companyId] : undefined,
  });

  if (filters.type === "movie") {
    const results = await Promise.all(pages.map((page) => discoverMovies(providerIds, page, discoverOptions("movie"))));
    const verifiedTitles = await verifyPersonMatches(results.flatMap((result) => result.results), filters);
    const titles = await enrichTitles(verifiedTitles, providerIds, filters.serviceId, filters.cost);
    return { titles: titles.slice(offset, offset + EXPLORER_PAGE_SIZE), totalPages: Math.max(1, Math.ceil((results[0]?.total_results ?? 0) / EXPLORER_PAGE_SIZE)) };
  }

  if (filters.type === "tv") {
    const results = await Promise.all(pages.map((page) => discoverTvShows(providerIds, page, discoverOptions("tv"))));
    const verifiedTitles = await verifyPersonMatches(results.flatMap((result) => result.results), filters);
    const titles = await enrichTitles(verifiedTitles, providerIds, filters.serviceId, filters.cost);
    return { titles: titles.slice(offset, offset + EXPLORER_PAGE_SIZE), totalPages: Math.max(1, Math.ceil((results[0]?.total_results ?? 0) / EXPLORER_PAGE_SIZE)) };
  }

  const blocks = await Promise.all(pages.map(async (page) => {
    const [movies, shows] = await Promise.all([
      discoverMovies(providerIds, page, discoverOptions("movie")),
      discoverTvShows(providerIds, page, discoverOptions("tv")),
    ]);
    return { movies, shows };
  }));
  const allTitles = blocks.flatMap(({ movies, shows }) => [...movies.results, ...shows.results]);
  const verifiedTitles = await verifyPersonMatches(allTitles, filters);
  const titles = await enrichTitles(verifiedTitles, providerIds, filters.serviceId, filters.cost);
  const totalResults = (blocks[0]?.movies.total_results ?? 0) + (blocks[0]?.shows.total_results ?? 0);
  return { titles: titles.slice(offset, offset + EXPLORER_PAGE_SIZE), totalPages: Math.max(1, Math.ceil(totalResults / EXPLORER_PAGE_SIZE)) };
}

function getSortBy(sort: SortOption, mediaType: "movie" | "tv"): string {
  if (sort === "rating") return "vote_average.desc";
  if (sort === "newest") return mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
  if (sort === "oldest") return mediaType === "movie" ? "primary_release_date.asc" : "first_air_date.asc";
  return "popularity.desc";
}

function compareTitles(first: TmdbMovie | TmdbTvShow, second: TmdbMovie | TmdbTvShow, sort: SortOption): number {
  if (sort === "rating") return second.vote_average - first.vote_average;
  if (sort === "newest" || sort === "oldest") {
    const firstDate = "title" in first ? first.release_date : first.first_air_date;
    const secondDate = "title" in second ? second.release_date : second.first_air_date;
    return sort === "newest" ? secondDate.localeCompare(firstDate) : firstDate.localeCompare(secondDate);
  }
  return 0;
}

async function getExplorerData(filters: ExplorerFiltersData) {
  const supabase = await createSupabaseServerClient();
  const [servicesResult, genres, personalTitlesResult, seasonRatingsResult, searchResult, companiesResult] = await Promise.all([
    supabase.from("streaming_services").select("tmdb_provider_id, name").order("name"),
    Promise.all([getGenres("movie"), getGenres("tv")]),
    supabase.from("user_titles").select("tmdb_id, media_type, status, rating_label"),
    supabase.from("user_seasons").select("tmdb_id, season_number, rating_label").not("rating_label", "is", null),
    filters.query ? searchTitles(filters.query, 1) : Promise.resolve(null),
    filters.query ? searchCompanies(filters.query, 1) : Promise.resolve(null),
  ]);
  if (servicesResult.error || personalTitlesResult.error || seasonRatingsResult.error) {
    throw new ExplorerDataError("Impossible de charger tes préférences. Réessaie dans quelques instants.");
  }
  const services = servicesResult.data;
  const personalTitles = personalTitlesResult.data;
  const seasonRatings = seasonRatingsResult.data;
  const exactPerson = !filters.personId && searchResult ? resolveExactPerson(filters.query, searchResult.results.filter((result): result is TmdbPerson => result.media_type === "person")) : null;
  const effectiveFilters = exactPerson ? { ...filters, personId: exactPerson.id, personRole: exactPerson.role } : filters;
  let activeProviderIds: number[];
  try {
    activeProviderIds = await getActiveTmdbProviderIds();
  } catch {
    throw new ExplorerDataError("Impossible de charger tes services actifs. Réessaie dans quelques instants.");
  }
  const providerIds = filters.allPlatforms ? [] : filters.serviceId ? [filters.serviceId] : activeProviderIds;
  const catalog = await getCatalogTitles(providerIds, effectiveFilters);
  const personalState = new Map((personalTitles ?? []).map((item) => [`${item.media_type}:${item.tmdb_id}`, item]));
  const seasonRatingMap = new Map<number, Array<{ seasonNumber: number; rating: NonNullable<CatalogTitleSummary["personalRating"]> }>>();
  for (const season of seasonRatings ?? []) {
    if (!season.rating_label) continue;
    const ratings = seasonRatingMap.get(season.tmdb_id) ?? [];
    ratings.push({ seasonNumber: season.season_number, rating: season.rating_label as NonNullable<CatalogTitleSummary["personalRating"]> });
    seasonRatingMap.set(season.tmdb_id, ratings);
  }
  const titles = catalog.titles.map((title) => {
    const state = personalState.get(`${title.mediaType}:${title.tmdbId}`);
    return { ...title, status: state?.status ?? null, personalRating: state?.rating_label as CatalogTitleSummary["personalRating"] ?? null, seasonRatings: seasonRatingMap.get(title.tmdbId) ?? [] };
  }).filter((title) => !filters.status || title.status === filters.status).filter((title) => !filters.personalRating || title.personalRating === filters.personalRating);
  const genreOptions = Array.from(new Map(genres.flatMap((result) => result.genres).map((genre) => [genre.id, genre.name])).entries()).sort(([, first], [, second]) => first.localeCompare(second, "fr"));
  return {
    titles,
    totalPages: catalog.totalPages,
    services: (services ?? []).map((service) => ({ id: String(service.tmdb_provider_id), label: service.name })),
    genres: genreOptions.map(([id, name]) => ({ id: String(id), label: name })),
    people: (searchResult?.results ?? []).filter((result): result is TmdbPerson => result.media_type === "person").slice(0, 20).map((person) => ({
      id: String(person.id),
      label: person.name,
      detail: person.known_for_department === "Directing" ? "Réalisateur" : "Acteur / équipe",
      role: person.known_for_department === "Directing" ? "director" as const : "actor" as const,
    })),
    companies: (companiesResult?.results ?? []).slice(0, 20).map((company) => ({ id: String(company.id), label: company.name, detail: company.origin_country ?? "" })),
    personSelection: exactPerson,
  };
}

function buildPageUrl(params: Record<string, string | string[] | undefined>, page: number, overrides: Record<string, string> = {}): string {
  const query = new URLSearchParams();
  for (const key of ["q", "type", "service", "quebec", "genre", "minRating", "year", "sort", "status", "personalRating", "cost", "personId", "personRole", "companyId"]) {
    const item = firstExplorerParam(params[key]);
    if (item) query.set(key, item);
  }
  for (const [key, value] of Object.entries(overrides)) query.set(key, value);
  query.set("page", String(page));
  return `?${query.toString()}`;
}

export default async function ExplorerPage({ searchParams }: { searchParams: SearchParams }) {
  const rawParams = await searchParams;
  const filters = parseExplorerFilters(rawParams);
  const result = await loadExplorerData(filters);
  if (result.error || !result.data) {
    return <main className={styles.page}><section className={styles.message} role="alert"><p className={styles.eyebrow}>Catalogue indisponible</p><h1>Impossible de charger Explorer</h1><p>{result.error ?? "La récupération du catalogue a échoué."} Vérifie ta configuration TMDB.</p></section></main>;
  }

  const { titles, totalPages, services, genres, people, companies, personSelection } = result.data;
  const resolvedPerson = filters.personId ? { id: filters.personId, role: filters.personRole } : personSelection;
  if (!filters.personId && resolvedPerson) {
    filters.personId = resolvedPerson.id;
    filters.personRole = resolvedPerson.role;
    rawParams.personId = `${resolvedPerson.id}:${resolvedPerson.role}`;
  }
  const hasActiveFilters = Boolean(filters.query || filters.type !== "all" || filters.serviceId || filters.allPlatforms || filters.genreId || filters.minRating || filters.year || filters.status || filters.personalRating || filters.quebec || filters.cost !== "free" || resolvedPerson || filters.companyId);
  return (
      <main className={styles.page}>
        <header className={styles.header}><div><p className={styles.eyebrow}>Canada · Mes plateformes</p><h1>Explorer</h1><p className={styles.intro}>Les films et séries disponibles sur tes services actifs au Canada.</p></div><TextLink className={styles.contextLink} href="/settings">Gérer mes services</TextLink></header>
        <p className={styles.rouletteLink}><TextLink href="/roulette">Lancer la roulette</TextLink></p>
        <ExplorerFiltersUnified services={services} genres={genres} people={people} companies={companies} />
        {titles.length > 0 ? <section className={styles.grid} aria-label="Catalogue disponible">{titles.map((title, index) => <MediaCard key={`${title.mediaType}-${title.tmdbId}`} title={title} priority={index === 0} />)}</section> : <p className={styles.message} role="status">{filters.personId || filters.companyId ? <>Aucun titre correspondant n’est disponible avec ces critères et tes services actifs. <Link href={buildPageUrl(rawParams, 1, { service: "all" })}>Afficher toutes les plateformes</Link>.</> : hasActiveFilters ? "Aucun titre ne correspond à ces filtres." : <>Aucun titre à afficher. Active au moins un service dans <Link href="/settings">Mes services</Link>.</>}</p>}
        {shouldShowPagination(filters.page, Math.min(totalPages, 500), titles.length, EXPLORER_PAGE_SIZE) && <Pagination current={filters.page} total={Math.min(totalPages, 500)} getHref={(page) => buildPageUrl(rawParams, page)} />}
      </main>
  );
}

class ExplorerDataError extends Error {}

async function loadExplorerData(filters: ExplorerFiltersData) {
  try {
    return { data: await getExplorerData(filters), error: null };
  } catch (error) {
    console.error("Explorer catalogue error", error instanceof Error ? error.message : "Unknown error");
    return {
      data: null,
      error: error instanceof TmdbApiError
        ? error.status === 0 ? "TMDB est momentanément indisponible." : `TMDB a répondu avec le statut ${error.status}.`
        : error instanceof ExplorerDataError ? error.message : "La récupération du catalogue a échoué. Réessaie dans quelques instants.",
    };
  }
}


