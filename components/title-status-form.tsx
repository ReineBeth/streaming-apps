"use client";

import { updateTitleRating, updateTitleStatus } from "@/app/titles/actions";
import type { PersonalRating, TitleStatus } from "@/types/domain";
import { useActionState } from "react";

import { SubmitButton } from "./submit-button";
import styles from "./title-status-form.module.css";

const statusOptions: Array<{ value: TitleStatus; label: string }> = [
  { value: "to_watch", label: "À voir" }, { value: "in_progress", label: "En cours" }, { value: "watched", label: "Vu" }, { value: "abandoned", label: "Abandonné" }, { value: "not_interested", label: "Pas intéressé" },
];
const ratingOptions: Array<{ value: PersonalRating; label: string }> = [
  { value: "bad", label: "Mauvais" }, { value: "okay", label: "Correct" }, { value: "good", label: "Bon" }, { value: "very_good", label: "Très bon" }, { value: "masterpiece", label: "Chef-d’œuvre" },
];

export function TitleStatusForm({ tmdbId, mediaType, status, rating }: { tmdbId: number; mediaType: "movie" | "tv"; status: TitleStatus | null; rating: PersonalRating | null }) {
  const [statusState, statusAction] = useActionState(runAction(updateTitleStatus), { error: null });
  const [ratingState, ratingAction] = useActionState(runAction(updateTitleRating), { error: null });

  return (
    <div className={styles.controls}>
      <form className={styles.form} action={statusAction}>
        <input type="hidden" name="tmdbId" value={tmdbId} /><input type="hidden" name="mediaType" value={mediaType} />
        <label htmlFor={`title-status-${mediaType}-${tmdbId}`}>Mon statut</label>
        <select id={`title-status-${mediaType}-${tmdbId}`} name="status" defaultValue={status ?? ""}><option value="" disabled>Choisir un statut</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <SubmitButton>Enregistrer</SubmitButton>
      </form>
      {statusState.error && <p className={styles.error} role="alert" aria-live="assertive">{statusState.error}</p>}
      {status === "watched" && <form className={styles.form} action={ratingAction}>
        <input type="hidden" name="tmdbId" value={tmdbId} /><input type="hidden" name="mediaType" value={mediaType} />
        <label htmlFor={`title-rating-${mediaType}-${tmdbId}`}>Ma note</label>
        <select id={`title-rating-${mediaType}-${tmdbId}`} name="ratingLabel" defaultValue={rating ?? ""}><option value="" disabled>Choisir une note</option>{ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <SubmitButton pendingLabel="Notation…">Noter</SubmitButton>
      </form>}
      {ratingState.error && <p className={styles.error} role="alert" aria-live="assertive">{ratingState.error}</p>}
    </div>
  );
}

function runAction(action: (formData: FormData) => Promise<void>) {
  return async (_previousState: { error: string | null }, formData: FormData) => {
    try {
      await action(formData);
      return { error: null };
    } catch (error) {
      if (isRedirectError(error)) throw error;
      return { error: error instanceof Error && error.message.includes("watched") ? "Une note est possible seulement pour un titre marqué comme vu." : "Impossible d'enregistrer. Réessaie dans quelques instants." };
    }
  };
}

function isRedirectError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}
