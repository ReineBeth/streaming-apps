import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { HistoryFilters } from "@/components/history-filters";
import { mapWithConcurrency } from "@/lib/explorer/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMovie, getTvShow } from "@/lib/tmdb/catalog";
import type { PersonalRating } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";

import styles from "./page.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type HistoryType = "all" | "movie" | "tv";
type HistoryEntry = { id: string; tmdbId: number; mediaType: "movie" | "tv"; title: string; label: string; posterPath: string | null; rating: PersonalRating | null; watchedAt: string };
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const ratingLabels: Record<PersonalRating, string> = { bad: "Mauvais", okay: "Correct", good: "Bon", very_good: "Très bon", masterpiece: "Chef-d’œuvre" };

function firstParam(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
function isRating(value: string): value is PersonalRating { return value === "bad" || value === "okay" || value === "good" || value === "very_good" || value === "masterpiece"; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value)); }

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = firstParam(params.type);
  const rating = firstParam(params.rating);
  const year = firstParam(params.year);
  const typeFilter: HistoryType = type === "movie" || type === "tv" ? type : "all";
  const ratingFilter = isRating(rating) ? rating : null;
  const yearFilter = /^\d{4}$/.test(year) ? year : null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fhistory");

  const [{ data: watchedTitles, error: titlesError }, { data: watchedSeasons, error: seasonsError }] = await Promise.all([
    supabase.from("user_titles").select("id, tmdb_id, media_type, rating_label, watched_at").eq("user_id", user.id).eq("status", "watched").not("watched_at", "is", null).order("watched_at", { ascending: false }).limit(100),
    supabase.from("user_seasons").select("id, tmdb_id, season_number, rating_label, watched_at").eq("user_id", user.id).eq("status", "watched").not("watched_at", "is", null).order("watched_at", { ascending: false }).limit(100),
  ]);
  if (titlesError || seasonsError) return <main className={styles.page}><p className={styles.message} role="alert">Impossible de charger ton historique. Vérifie que la migration des saisons est exécutée.</p></main>;

  const tvCache = new Map<number, ReturnType<typeof getTvShow>>();
  const getCachedShow = (id: number) => { const cached = tvCache.get(id); if (cached) return cached; const request = getTvShow(id); tvCache.set(id, request); return request; };
  const titleEntries = await mapWithConcurrency(watchedTitles ?? [], 4, async (item): Promise<HistoryEntry> => {
    try {
      const title = item.media_type === "movie" ? await getMovie(item.tmdb_id) : await getCachedShow(item.tmdb_id);
    const movie = title as TmdbMovie;
    const show = title as TmdbTvShow;
    return { id: item.id, tmdbId: item.tmdb_id, mediaType: item.media_type, title: item.media_type === "movie" ? movie.title : show.name, label: item.media_type === "movie" ? "Film" : "Série", posterPath: title.poster_path, rating: isRating(item.rating_label ?? "") ? item.rating_label : null, watchedAt: item.watched_at! };
    } catch (error) {
      console.error("History title enrichment error", error);
      return { id: item.id, tmdbId: item.tmdb_id, mediaType: item.media_type, title: "Titre indisponible", label: item.media_type === "movie" ? "Film" : "Série", posterPath: null, rating: isRating(item.rating_label ?? "") ? item.rating_label : null, watchedAt: item.watched_at! };
    }
  });
  const seasonEntries = await mapWithConcurrency(watchedSeasons ?? [], 4, async (item): Promise<HistoryEntry> => {
    try {
      const show = await getCachedShow(item.tmdb_id);
    return { id: item.id, tmdbId: item.tmdb_id, mediaType: "tv", title: show.name, label: `Série · Saison ${item.season_number}`, posterPath: show.poster_path, rating: isRating(item.rating_label ?? "") ? item.rating_label : null, watchedAt: item.watched_at! };
    } catch (error) {
      console.error("History season enrichment error", error);
      return { id: item.id, tmdbId: item.tmdb_id, mediaType: "tv", title: "Série indisponible", label: `Série · Saison ${item.season_number}`, posterPath: null, rating: isRating(item.rating_label ?? "") ? item.rating_label : null, watchedAt: item.watched_at! };
    }
  });
  const entries = [...titleEntries, ...seasonEntries].filter((entry) => typeFilter === "all" || entry.mediaType === typeFilter).filter((entry) => !ratingFilter || entry.rating === ratingFilter).filter((entry) => !yearFilter || entry.watchedAt.startsWith(yearFilter)).sort((first, second) => second.watchedAt.localeCompare(first.watchedAt));

  return <main className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Ma progression</p><h1>Mon historique</h1><p>Les titres et saisons que tu as marqués comme vus.</p></header>
    <HistoryFilters type={typeFilter} rating={ratingFilter ?? "all"} year={year} />
    {entries.length > 0 ? <section className={styles.list} aria-label="Mon historique">{entries.map((entry) => <article className={styles.entry} key={entry.id}>
      {entry.posterPath && <Image src={`${IMAGE_URL}${entry.posterPath}`} alt={`Affiche de ${entry.title}`} width={80} height={120} />}
      <div className={styles.details}><p className={styles.entryType}>{entry.label}</p><h2>{entry.title}</h2><p>Vu le {formatDate(entry.watchedAt)}</p>{entry.rating && <p className={styles.rating}>Ma note : {ratingLabels[entry.rating]}</p>}<Link href={`/titles/${entry.mediaType}/${entry.tmdbId}`}>Voir la fiche</Link></div>
    </article>)}</section> : <p className={styles.empty} role="status">Aucun titre ne correspond à ces filtres.</p>}
  </main>;
}
