import Link from "next/link";
import { TextLink } from "@/components/ui";
import { redirect } from "next/navigation";

import { RouletteFilters } from "@/components/roulette-filters";
import { RoulettePicker } from "@/components/roulette-picker";
import { getRouletteCandidates, type RouletteFilters as RouletteFilterValues } from "@/lib/roulette/candidates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/tmdb/catalog";
import { TmdbApiError } from "@/lib/tmdb/client";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseFilters(params: Record<string, string | string[] | undefined>): RouletteFilterValues {
  const type = firstParam(params.type);
  const genreId = Number.parseInt(firstParam(params.genre), 10);
  const minRating = Number.parseFloat(firstParam(params.minRating));
  const status = firstParam(params.status);
  const recommendedByFriend = firstParam(params.recommended) === "true";
  return {
    type: type === "movie" || type === "tv" ? type : "all",
    genreId: Number.isFinite(genreId) ? genreId : null,
    minRating: Number.isFinite(minRating) && minRating >= 0 && minRating <= 10 ? minRating : null,
    status: status === "empty" || status === "to_watch" || status === "in_progress" || status === "watched" || status === "abandoned" || status === "not_interested" ? status : null,
    recommendedByFriend,
  };
}

async function getRouletteData(filters: RouletteFilterValues) {
  const [genres, candidates] = await Promise.all([
    Promise.all([getGenres("movie"), getGenres("tv")]),
    getRouletteCandidates(filters),
  ]);
  const genreOptions = Array.from(new Map(genres.flatMap((result) => result.genres).map((genre) => [genre.id, genre.name])).entries())
    .sort(([, first], [, second]) => first.localeCompare(second, "fr"))
    .map(([id, label]) => ({ id: String(id), label }));
  return { candidates, genres: genreOptions };
}

export default async function RoulettePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Froulette");

  const filters = parseFilters(await searchParams);
  const result = await loadRouletteData(filters);
  if (result.error || !result.data) {
    return <main className={styles.page}><section className={styles.message} role="alert"><p className={styles.eyebrow}>Roulette indisponible</p><h1>Impossible de charger les candidats</h1><p>{result.error instanceof TmdbApiError ? `TMDB a répondu avec le statut ${result.error.status}.` : "Vérifie ta configuration TMDB et tes services actifs."}</p></section></main>;
  }

  const { candidates, genres } = result.data;
  return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Choix du soir</p>
            <h1>Roulette</h1>
            <p className={styles.intro}>Laisse le hasard choisir un film ou une série parmi tes critères.</p>
          </div>
          <TextLink className={styles.contextLink} href="/explorer">Retour à Explorer</TextLink>
        </header>
        <RouletteFilters genres={genres} values={filters} />
        {candidates.length > 0 ? <RoulettePicker key={`${filters.type}:${filters.genreId}:${filters.minRating}:${filters.status ?? "all"}`} candidates={candidates} /> : <section className={styles.candidateState} aria-live="polite"><h2>Aucun titre disponible</h2><p>Essaie d&apos;élargir tes filtres ou vérifie tes services actifs dans <Link href="/settings">Paramètres</Link>.</p></section>}
      </main>
  );
}

async function loadRouletteData(filters: RouletteFilterValues) {
  try {
    return { data: await getRouletteData(filters), error: null };
  } catch (error) {
    console.error("Roulette candidates error", error instanceof Error ? error.message : "Unknown error");
    return { data: null, error };
  }
}
