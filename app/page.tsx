import Link from "next/link";

import { MediaCard } from "@/components/media-card";
import { RecommendationSection } from "@/components/recommendation-section";
import { mapWithConcurrency } from "@/lib/explorer/enrichment";
import { getActiveTmdbProviderIds } from "@/lib/streaming-services";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverMovies, discoverTvShows, getMovie, getTvShow, getWatchProviders } from "@/lib/tmdb/catalog";
import type { CatalogTitleSummary, WatchProvider } from "@/types/domain";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function toSummary(title: Awaited<ReturnType<typeof getMovie>> | Awaited<ReturnType<typeof getTvShow>>, providers: CatalogTitleSummary["providers"]): CatalogTitleSummary {
  const isMovie = "title" in title;
  const date = isMovie ? title.release_date : title.first_air_date;
  return { tmdbId: title.id, mediaType: isMovie ? "movie" : "tv", title: isMovie ? title.title : title.name, overview: title.overview, year: Number.parseInt(date.slice(0, 4), 10) || null, posterPath: title.poster_path, tmdbRating: title.vote_average || null, languages: title.original_language ? [title.original_language] : [], providers, status: null, personalRating: null, seasonRatings: [] };
}

async function enrich(title: { id: number; mediaType: "movie" | "tv" }, providerIds: number[], state: CatalogTitleSummary["status"] = null): Promise<CatalogTitleSummary> {
  try {
    const details = title.mediaType === "movie" ? await getMovie(title.id) : await getTvShow(title.id);
    let providers: WatchProvider[] = [];
    try {
      providers = (await getWatchProviders(title.id, title.mediaType)).filter((provider) => providerIds.length === 0 || providerIds.includes(provider.id));
    } catch (error) {
      console.error("Home provider enrichment error", error instanceof Error ? error.message : "Unknown error");
    }
    return { ...toSummary(details, providers), status: state };
  } catch (error) {
    console.error("Home title enrichment error", error instanceof Error ? error.message : "Unknown error");
    return { tmdbId: title.id, mediaType: title.mediaType, title: "Titre indisponible", overview: "Les détails de ce titre sont temporairement indisponibles.", year: null, posterPath: null, tmdbRating: null, languages: [], providers: [], status: state, personalRating: null, seasonRatings: [] };
  }
}

async function enrichList(titles: Array<{ id: number; mediaType: "movie" | "tv" }>, providerIds: number[], state: CatalogTitleSummary["status"] = null) {
  return mapWithConcurrency(titles, 4, (title) => enrich(title, providerIds, state));
}

async function getHomeData() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const providerIds = user ? await getActiveTmdbProviderIds() : [];
  const [movies, shows] = await Promise.all([discoverMovies(providerIds, 1), discoverTvShows(providerIds, 1)]);
  const popularMovies = await enrichList(movies.results.slice(0, 6).map((title) => ({ id: title.id, mediaType: "movie" as const })), providerIds);
  const popularShows = await enrichList(shows.results.slice(0, 6).map((title) => ({ id: title.id, mediaType: "tv" as const })), providerIds);
  if (!user) return { user: null, inProgress: [], watchlist: [], suggestions: [], movies: popularMovies, shows: popularShows };

  const { data: personalTitles } = await supabase.from("user_titles").select("tmdb_id, media_type, status, rating_label").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100);
  const inProgress = await enrichList((personalTitles ?? []).filter((title) => title.status === "in_progress").slice(0, 6).map((title) => ({ id: title.tmdb_id, mediaType: title.media_type })), providerIds, "in_progress");
  const watchlist = await enrichList((personalTitles ?? []).filter((title) => title.status === "to_watch").slice(0, 6).map((title) => ({ id: title.tmdb_id, mediaType: title.media_type })), providerIds, "to_watch");
  const excluded = new Set((personalTitles ?? []).map((title) => `${title.media_type}:${title.tmdb_id}`));
  const suggestions = await getPersonalizedRecommendations(personalTitles ?? [], providerIds, excluded);
  return { user, inProgress, watchlist, suggestions, movies: popularMovies, shows: popularShows };
}

function Section({ title, href, titles, isAuthenticated = true }: { title: string; href?: string; titles: CatalogTitleSummary[]; isAuthenticated?: boolean }) {
  if (titles.length === 0) return null;
  return <section className={styles.section}><div className={styles.sectionHeader}><h2>{title}</h2>{href && <Link href={href}>Voir tout →</Link>}</div><div className={styles.grid}>{titles.map((item, index) => <MediaCard key={`${item.mediaType}-${item.tmdbId}`} title={item} priority={index === 0} isAuthenticated={isAuthenticated} />)}</div></section>;
}

export default async function Home() {
  const { user, inProgress, watchlist, suggestions, movies, shows } = await getHomeData();
  if (!user) return <main className={styles.page}><section className={styles.welcome}><p className={styles.eyebrow}>Streaming Apps</p><h1>Des films et séries à découvrir au Canada.</h1><p>Explore les titres populaires et ouvre leurs fiches sans créer de compte. Connecte-toi seulement pour gérer tes statuts, tes notes et ta liste personnelle.</p><Link className={styles.primaryLink} href="/login">Se connecter</Link></section><Section title="Films populaires au Canada" href="/explorer?type=movie&service=all" titles={movies} isAuthenticated={false} /><Section title="Séries populaires au Canada" href="/explorer?type=tv&service=all" titles={shows} isAuthenticated={false} /></main>;

  return <main className={styles.page}><header className={styles.hero}><p className={styles.eyebrow}>Ton espace personnel</p><h1>Qu’est-ce qu’on regarde ?</h1><p>Retrouve ta progression et les nouveautés disponibles sur tes services actifs.</p></header><Section title="Continuer à regarder" href="/history?type=tv" titles={inProgress} /><Section title="Ma liste" href="/watchlist" titles={watchlist} /><RecommendationSection titles={suggestions} storageKey={`streaming-apps-dismissed:${user.id}`} /><Section title="Films populaires sur mes plateformes" href="/explorer?type=movie" titles={movies} /><Section title="Séries populaires sur mes plateformes" href="/explorer?type=tv" titles={shows} /></main>;
}
