"use client";

import Link from "next/link";
import type { PersonalRating, TitleStatus } from "@/types/domain";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import styles from "./title-status-form.module.css";

const statusOptions: Array<{ value: TitleStatus; label: string }> = [
  { value: "to_watch", label: "À voir" }, { value: "in_progress", label: "En cours" }, { value: "watched", label: "Vu" }, { value: "abandoned", label: "Abandonné" }, { value: "not_interested", label: "Pas intéressé" },
];
const ratingOptions: Array<{ value: PersonalRating; label: string }> = [
  { value: "bad", label: "Mauvais" }, { value: "okay", label: "Correct" }, { value: "good", label: "Bon" }, { value: "very_good", label: "Très bon" }, { value: "masterpiece", label: "Chef-d’œuvre" },
];

export function TitleStatusForm({ tmdbId, mediaType, status, rating, isAuthenticated }: { tmdbId: number; mediaType: "movie" | "tv"; status: TitleStatus | null; rating: PersonalRating | null; isAuthenticated: boolean }) {
  const [currentStatus, setCurrentStatus] = useState<TitleStatus | null>(status);
  const [currentRating, setCurrentRating] = useState<PersonalRating | null>(rating);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextStatus = formData.get("status");
    if (typeof nextStatus !== "string" || !statusOptions.some((option) => option.value === nextStatus)) return;
    startTransition(async () => {
      try {
        await saveTitleState({ action: "status", tmdbId, mediaType, status: nextStatus });
        setCurrentStatus(nextStatus as TitleStatus);
        setError(null);
      } catch (actionError) {
        setError(getActionErrorMessage(actionError));
      }
    });
  }

  function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextRating = formData.get("ratingLabel");
    if (typeof nextRating !== "string" || !ratingOptions.some((option) => option.value === nextRating)) return;
    startTransition(async () => {
      try {
        await saveTitleState({ action: "rating", tmdbId, mediaType, ratingLabel: nextRating });
        setCurrentRating(nextRating as PersonalRating);
        setError(null);
      } catch (actionError) {
        setError(getActionErrorMessage(actionError));
      }
    });
  }

  if (!isAuthenticated) {
    const nextPath = `/titles/${mediaType}/${tmdbId}`;
    return <Link className={styles.loginLink} href={`/login?next=${encodeURIComponent(nextPath)}`}>Se connecter pour ajouter un statut ou une note</Link>;
  }

  return (
    <div className={styles.controls}>
      <form className={styles.form} onSubmit={submitStatus}>
        <input type="hidden" name="tmdbId" value={tmdbId} /><input type="hidden" name="mediaType" value={mediaType} />
        <label htmlFor={`title-status-${mediaType}-${tmdbId}`}>Mon statut</label>
        <select id={`title-status-${mediaType}-${tmdbId}`} name="status" defaultValue={currentStatus ?? ""}><option value="" disabled>Choisir un statut</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <button type="submit" disabled={isPending}>Enregistrer</button>
      </form>
      {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
      {currentStatus === "watched" && <form className={styles.form} onSubmit={submitRating}>
        <input type="hidden" name="tmdbId" value={tmdbId} /><input type="hidden" name="mediaType" value={mediaType} />
        <label htmlFor={`title-rating-${mediaType}-${tmdbId}`}>Ma note</label>
        <select id={`title-rating-${mediaType}-${tmdbId}`} name="ratingLabel" defaultValue={currentRating ?? ""}><option value="" disabled>Choisir une note</option>{ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <button type="submit" disabled={isPending}>Noter</button>
      </form>}
    </div>
  );
}

function getActionErrorMessage(error: unknown): string {
  if (isRedirectError(error)) return "Session expirée. Reconnecte-toi pour continuer.";
  return error instanceof Error && error.message.includes("watched") ? "Note possible seulement pour un titre marqué comme vu." : "Impossible d enregistrer. Réessaie dans quelques instants.";
}

async function saveTitleState(payload: Record<string, string | number>): Promise<void> {
  const response = await fetch("/api/titles/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "Unable to save title state");
  }
}

function isRedirectError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}
