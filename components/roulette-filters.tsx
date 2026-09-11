"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useTransition } from "react";

import { Button } from "@/components/ui";
import type { RouletteTypeFilter } from "@/lib/roulette/candidates";
import type { RouletteStatusFilter } from "@/lib/roulette/candidate-filters";

import styles from "./roulette-filters.module.css";

interface FilterOption {
  id: string;
  label: string;
}

interface RouletteFiltersProps {
  genres: FilterOption[];
  values: {
    type: RouletteTypeFilter;
    genreId: number | null;
    minRating: number | null;
    status: RouletteStatusFilter;
  };
}

export function RouletteFilters({ genres, values }: RouletteFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchParamsKey = searchParams.toString();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value && value !== "all") params.set(key, value);
    }

    startTransition(() => router.push(`${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`));
  }

  return (
    <form key={searchParamsKey} className={styles.filters} onSubmit={submit} aria-label="Filtres de la roulette" aria-busy={isPending}>
      <label>
        <span>Type</span>
        <select name="type" defaultValue={searchParams.get("type") ?? values.type}>
          <option value="all">Films et séries</option>
          <option value="movie">Films</option>
          <option value="tv">Séries</option>
        </select>
      </label>
      <label>
        <span>Genre</span>
        <select name="genre" defaultValue={searchParams.get("genre") ?? (values.genreId?.toString() ?? "all")}>
          <option value="all">Tous les genres</option>
          {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.label}</option>)}
        </select>
      </label>
      <label>
        <span>Note TMDB minimale</span>
        <select name="minRating" defaultValue={searchParams.get("minRating") ?? (values.minRating?.toString() ?? "all")}>
          <option value="all">Toutes les notes</option>
          <option value="6">6 / 10 et plus</option>
          <option value="7">7 / 10 et plus</option>
          <option value="8">8 / 10 et plus</option>
          <option value="9">9 / 10 et plus</option>
        </select>
      </label>
      <label>
        <span>Mon statut</span>
        <select name="status" defaultValue={searchParams.get("status") ?? (values.status ?? "all")}>
          <option value="all">Tous les statuts</option>
          <option value="empty">Sans statut</option>
          <option value="to_watch">À voir</option>
          <option value="in_progress">En cours</option>
          <option value="watched">Vu</option>
          <option value="abandoned">Abandonné</option>
          <option value="not_interested">Pas intéressé</option>
        </select>
      </label>
      <div className={styles.actions}>
        <Button type="submit">Appliquer les filtres</Button>
        <Button type="button" variant="secondary" onClick={() => router.push(pathname)}>Réinitialiser</Button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{isPending ? "Mise à jour des candidats…" : ""}</p>
    </form>
  );
}
