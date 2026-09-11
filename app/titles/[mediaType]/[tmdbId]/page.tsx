import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getActiveTmdbProviderIds } from "@/lib/streaming-services";
import { parseTitleRoute } from "@/lib/titles/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMovie, getTvShow, getWatchProviders } from "@/lib/tmdb/catalog";
import { TmdbApiError } from "@/lib/tmdb/client";
import { getLanguageLabel } from "@/lib/tmdb/languages";
import { mapTitleCompanies, mapTitlePeople } from "@/lib/tmdb/details";
import type { PersonalRating, TitleStatus } from "@/types/domain";
import type { TmdbMovie, TmdbTvShow } from "@/types/tmdb";
import { TitleStatusForm } from "@/components/title-status-form";
import { SeasonTracker } from "@/components/season-tracker";

import styles from "./page.module.css";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

function formatYear(date: string): string { return date ? date.slice(0, 4) : "Année inconnue"; }
function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "Durée inconnue";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours} h ${remainingMinutes} min` : `${remainingMinutes} min`;
}

export default async function TitleDetailsPage({ params }: { params: Promise<{ mediaType: string; tmdbId: string }> }) {
  const { mediaType, tmdbId } = await params;
  const route = parseTitleRoute(mediaType, tmdbId);
  if (!route) notFound();
  const { mediaType: validMediaType, tmdbId: id } = route;

  let title: TmdbMovie | TmdbTvShow;
  try {
    title = validMediaType === "movie" ? await getMovie(id) : await getTvShow(id);
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) notFound();
    console.error("Title details error", error instanceof Error ? error.message : "Unknown error");
    return <TitleLoadError />;
  }

  const [providersResult, activeProvidersResult] = await Promise.allSettled([
    getWatchProviders(id, validMediaType),
    getActiveTmdbProviderIds(),
  ]);
  const providers = providersResult.status === "fulfilled" ? providersResult.value : [];
  const activeProviderIds = activeProvidersResult.status === "fulfilled" ? activeProvidersResult.value : [];
  if (providersResult.status === "rejected") console.error("Title providers error", providersResult.reason);
  if (activeProvidersResult.status === "rejected") console.error("Active providers error", activeProvidersResult.reason);
  const supabase = await createSupabaseServerClient();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch (error) {
    console.error("Title auth state error", error instanceof Error ? error.message : "Unknown error");
  }
  const { data: userTitle } = user ? await supabase.from("user_titles").select("status, rating_label").eq("user_id", user.id).eq("tmdb_id", id).eq("media_type", validMediaType).maybeSingle() : { data: null };
  const activeProviders = providers.filter((provider) => activeProviderIds.includes(provider.id));
  const isMovie = validMediaType === "movie";
  const { data: seasonStates } = !isMovie && user ? await supabase.from("user_seasons").select("season_number, status, rating_label").eq("user_id", user.id).eq("tmdb_id", id) : { data: [] };
  const movie = title as TmdbMovie;
  const show = title as TmdbTvShow;
  const name = isMovie ? movie.title : show.name;
  const releaseDate = isMovie ? movie.release_date : show.first_air_date;
  const people = mapTitlePeople(title.credits);
  const companies = mapTitleCompanies(title.production_companies);

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/explorer">← Retour à Explorer</Link>
      <article className={styles.hero}>
        {title.backdrop_path && <Image className={styles.backdrop} src={`${TMDB_IMAGE_BASE_URL}original${title.backdrop_path}`} alt="" fill priority sizes="100vw" />}
        <div className={styles.overlay} />
        <div className={styles.heroContent}>
          {title.poster_path && <Image className={styles.poster} src={`${TMDB_IMAGE_BASE_URL}w500${title.poster_path}`} alt={`Affiche de ${name}`} width={280} height={420} priority />}
          <div className={styles.info}>
            <p className={styles.eyebrow}>{isMovie ? "Film" : "Série"} · {formatYear(releaseDate)}</p>
            <h1>{name}</h1>
            <p className={styles.rating}>★ {title.vote_average?.toFixed(1) ?? "—"} / 10 TMDB</p>
            <p className={styles.overview}>{title.overview || "Aucune description disponible."}</p>
            <TitleStatusForm key={`${validMediaType}-${id}-${userTitle?.status ?? "none"}`} tmdbId={id} mediaType={validMediaType} status={(userTitle?.status as TitleStatus | undefined) ?? null} rating={(userTitle?.rating_label as PersonalRating | null) ?? null} />
            <dl className={styles.metadata}>
              <div><dt>Langue originale</dt><dd>{title.original_language ? getLanguageLabel(title.original_language) : "Non renseignée"}</dd></div>
              <div><dt>Genres</dt><dd>{title.genres?.map((genre) => genre.name).join(", ") || "Non renseignés"}</dd></div>
              <div><dt>{isMovie ? "Durée" : "Saisons"}</dt><dd>{isMovie ? formatRuntime(movie.runtime) : show.number_of_seasons ? `${show.number_of_seasons} saison${show.number_of_seasons > 1 ? "s" : ""}` : "Non renseigné"}</dd></div>
            </dl>
            <section className={styles.providersSection} aria-labelledby="providers-title">
              <h2 id="providers-title">Disponible sur mes services</h2>
              {activeProviders.length > 0 ? <ul className={styles.providers}>{activeProviders.map((provider) => <li key={provider.id}>{provider.name}{provider.isPaid && <span className={styles.paid} title="Disponible avec un achat ou une location">$<span className={styles.srOnly}> achat ou location requis</span></span>}</li>)}</ul> : <p className={styles.muted}>Ce titre n’est pas disponible sur tes services actifs.</p>}
            </section>
          </div>
        </div>
      </article>
      {!isMovie && <SeasonTracker key={(seasonStates ?? []).map((state) => `${state.season_number}:${state.status}:${state.rating_label ?? ""}`).join("|")} showId={id} seasons={show.seasons ?? []} states={seasonStates ?? []} />}
      <section className={styles.creditsSection} aria-labelledby="credits-title">
        <h2 id="credits-title">Distribution et équipe</h2>
        <div className={styles.creditColumns}>
          <CreditList title="Acteurs principaux" items={people.cast.map((credit) => credit.character ? `${credit.name} · ${credit.character}` : credit.name)} />
          <CreditList title="Réalisation" items={people.directors.map((credit) => credit.name)} />
          <CreditList title="Scénario" items={people.writers.map((credit) => credit.name)} />
          <CreditList title="Production et distribution" items={companies.map((company) => company.name)} />
        </div>
      </section>
    </main>
  );
}

function CreditList({ title, items }: { title: string; items: string[] }) {
  const headingId = `credit-${title.toLowerCase().replaceAll(" ", "-")}`;
  return <section className={styles.creditGroup} aria-labelledby={headingId}><h3 id={headingId}>{title}</h3>{items.length > 0 ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className={styles.muted}>Information non renseignée.</p>}</section>;
}

function TitleLoadError() {
  return <main className={styles.page}><section className={styles.message} role="alert"><p className={styles.eyebrow}>Fiche indisponible</p><h1>Impossible de charger cette fiche</h1><p>TMDB est momentanément indisponible. Réessaie dans quelques instants.</p><Link className={styles.backLink} href="/explorer">Retour à Explorer</Link></section></main>;
}
