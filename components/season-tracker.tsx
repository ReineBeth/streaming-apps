"use client";

import { updateAllSeasonStates } from "@/app/titles/actions";
import type { PersonalRating, TitleStatus } from "@/types/domain";
import type { TmdbSeason } from "@/types/tmdb";
import { useActionState } from "react";

import { SubmitButton } from "./submit-button";
import styles from "./season-tracker.module.css";

const statuses: Array<[TitleStatus, string]> = [["to_watch", "À voir"], ["in_progress", "En cours"], ["watched", "Vu"], ["abandoned", "Abandonné"], ["not_interested", "Pas intéressé"]];
const ratings: Array<[PersonalRating, string]> = [["bad", "Mauvais"], ["okay", "Correct"], ["good", "Bon"], ["very_good", "Très bon"], ["masterpiece", "Chef-d’œuvre"]];
interface SeasonState { season_number: number; status: TitleStatus; rating_label: PersonalRating | null }

export function SeasonTracker({ showId, seasons, states }: { showId: number; seasons: TmdbSeason[]; states: SeasonState[] }) {
  const visibleSeasons = seasons.filter((season) => season.season_number > 0);
  const [actionState, action] = useActionState(runSeasonAction, { error: null });
  return (
    <section className={styles.section} aria-labelledby="seasons-title">
      <h2 id="seasons-title">Suivi des saisons</h2>
      {visibleSeasons.length === 0 ? <p className={styles.empty} role="status">Aucune saison à suivre pour cette série.</p> : <form className={styles.form} action={action}>
        <input type="hidden" name="tmdbId" value={showId} />
        <input type="hidden" name="seasonNumbers" value={visibleSeasons.map((season) => season.season_number).join(",")} />
        <div className={styles.list}>
          {visibleSeasons.map((season) => {
            const state = states.find((item) => item.season_number === season.season_number);
            return <article className={styles.season} key={season.id}>
              <div className={styles.seasonInfo}><h3>{season.name || `Saison ${season.season_number}`}</h3><p>{season.episode_count} épisodes{season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ""}</p></div>
              <label htmlFor={`season-status-${showId}-${season.season_number}`}>Statut</label>
              <select id={`season-status-${showId}-${season.season_number}`} name={`status-${season.season_number}`} defaultValue={state?.status ?? ""}><option value="">Non suivi</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <label htmlFor={`season-rating-${showId}-${season.season_number}`}>Note</label>
              <select id={`season-rating-${showId}-${season.season_number}`} name={`ratingLabel-${season.season_number}`} defaultValue={state?.rating_label ?? ""}><option value="">Aucune</option>{ratings.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </article>;
          })}
        </div>
        <SubmitButton className={styles.saveButton} pendingLabel="Enregistrement…">Enregistrer les saisons</SubmitButton>
        {actionState.error && <p className={styles.error} role="alert" aria-live="assertive">{actionState.error}</p>}
      </form>}
    </section>
  );
}

async function runSeasonAction(_previousState: { error: string | null }, formData: FormData) {
  try {
    await updateAllSeasonStates(formData);
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Impossible d'enregistrer les saisons. Réessaie dans quelques instants." };
  }
}

function isRedirectError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}
