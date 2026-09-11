import Link from "next/link";
import { redirect } from "next/navigation";

import { MediaCard } from "@/components/media-card";
import { Pagination } from "@/components/pagination";
import { WatchlistFilters } from "@/components/watchlist-filters";
import { mapWithConcurrency } from "@/lib/explorer/enrichment";
import { getActiveTmdbProviderIds } from "@/lib/streaming-services";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenres, getMovie, getTvShow, getWatchProviders } from "@/lib/tmdb/catalog";
import { matchesWatchlistFilters, parseWatchlistFilters, type WatchlistFilterableTitle } from "@/lib/watchlist/filters";
import type { WatchProvider } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const WATCHLIST_PAGE_SIZE = 36;

function firstWatchlistParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildWatchlistPageUrl(params: Record<string, string | string[] | undefined>, page: number): string {
  const query = new URLSearchParams();
  for (const key of ["type", "service", "genre"]) {
    const value = firstWatchlistParam(params[key]);
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `?${query.toString()}`;
}

export default async function WatchlistPage({ searchParams }: { searchParams: SearchParams }) {
  const rawParams = await searchParams;
  const filters = parseWatchlistFilters(rawParams);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fwatchlist");

  const [{ data: userTitles, error }, { data: streamingServices }] = await Promise.all([
    supabase.from("user_titles").select("tmdb_id, media_type").eq("user_id", user.id).eq("status", "to_watch").order("updated_at", { ascending: false }),
    supabase.from("streaming_services").select("tmdb_provider_id, name").order("name"),
  ]);
  if (error) return <main className={styles.page}><p className={styles.message} role="alert">Impossible de charger ta liste.</p></main>;

  const [activeProviderIds, genreResults] = await Promise.all([
    getActiveTmdbProviderIds(),
    Promise.all([getGenres("movie"), getGenres("tv")]),
  ]);
  const genreOptions = Array.from(new Map(genreResults.flatMap((result) => result.genres).map((genre) => [genre.id, genre.name])).entries()).sort(([, first], [, second]) => first.localeCompare(second, "fr"));
  const services = (streamingServices ?? []).filter((service) => activeProviderIds.includes(service.tmdb_provider_id)).map((service) => ({ id: String(service.tmdb_provider_id), label: service.name }));
  const titles = await mapWithConcurrency(userTitles ?? [], 4, async (userTitle): Promise<WatchlistFilterableTitle> => {
    try {
      const title = userTitle.media_type === "movie" ? await getMovie(userTitle.tmdb_id) : await getTvShow(userTitle.tmdb_id);
      let providers: WatchProvider[] = [];
      try {
        providers = (await getWatchProviders(userTitle.tmdb_id, userTitle.media_type)).filter((provider) => activeProviderIds.includes(provider.id));
      } catch (providerError) {
        console.error("Watchlist provider enrichment error", providerError);
      }
      const isMovie = userTitle.media_type === "movie";
      const movie = title as TmdbMovie;
      const show = title as TmdbTvShow;
      const date = isMovie ? movie.release_date : show.first_air_date;
      return { tmdbId: title.id, mediaType: userTitle.media_type, title: isMovie ? movie.title : show.name, overview: title.overview, year: Number.parseInt(date.slice(0, 4), 10) || null, posterPath: title.poster_path, tmdbRating: title.vote_average || null, languages: title.original_language ? [title.original_language] : [], providers, genreIds: title.genres?.map((genre) => genre.id) ?? [], status: "to_watch", personalRating: null, seasonRatings: [] };
    } catch (titleError) {
      console.error("Watchlist title enrichment error", titleError);
      return { tmdbId: userTitle.tmdb_id, mediaType: userTitle.media_type, title: "Titre indisponible", overview: "Les détails de ce titre sont temporairement indisponibles.", year: null, posterPath: null, tmdbRating: null, languages: [], providers: [], genreIds: [], status: "to_watch", personalRating: null, seasonRatings: [] };
    }
  });
  const filteredTitles = titles.filter((title) => matchesWatchlistFilters(title, filters));
  const totalPages = Math.max(1, Math.ceil(filteredTitles.length / WATCHLIST_PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const pagedTitles = filteredTitles.slice((currentPage - 1) * WATCHLIST_PAGE_SIZE, currentPage * WATCHLIST_PAGE_SIZE);

  return (
    <main className={styles.page}>
      <header className={styles.header}><p className={styles.eyebrow}>Ma sélection</p><h1>À voir</h1><p>Les films et séries que tu veux regarder plus tard.</p></header>
      <WatchlistFilters services={services} genres={genreOptions.map(([id, name]) => ({ id: String(id), label: name }))} />
      {filteredTitles.length > 0 ? <><section className={styles.grid} aria-label="Ma liste à voir">{pagedTitles.map((title, index) => <MediaCard key={`${title.mediaType}-${title.tmdbId}`} title={title} priority={index === 0} />)}</section><Pagination current={currentPage} total={totalPages} getHref={(page) => buildWatchlistPageUrl(rawParams, page)} /></> : <section className={styles.empty}><h2>{titles.length > 0 ? "Aucun titre ne correspond à ces filtres." : "Ta liste est vide"}</h2><p>{titles.length > 0 ? "Essaie de modifier tes critères." : "Ajoute un titre depuis sa fiche détaillée avec le statut « À voir »."}</p><Link href="/explorer">Explorer le catalogue</Link></section>}
    </main>
  );
}

