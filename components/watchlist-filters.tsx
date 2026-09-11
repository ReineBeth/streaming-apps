"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useTransition } from "react";

import { Button } from "@/components/ui";
import styles from "./watchlist-filters.module.css";

interface FilterOption {
  id: string;
  label: string;
}

export function WatchlistFilters({ services, genres }: { services: FilterOption[]; genres: FilterOption[] }) {
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
    <form key={searchParamsKey} className={styles.filters} onSubmit={submit} aria-label="Filtrer ma liste à voir" aria-busy={isPending}>
      <label><span>Type</span><select name="type" defaultValue={searchParams.get("type") ?? "all"}><option value="all">Films et séries</option><option value="movie">Films</option><option value="tv">Séries</option></select></label>
      <label><span>Plateforme</span><select name="service" defaultValue={searchParams.get("service") ?? "all"}><option value="all">Toutes les plateformes</option>{services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}</select></label>
      <label><span>Genre</span><select name="genre" defaultValue={searchParams.get("genre") ?? "all"}><option value="all">Tous les genres</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.label}</option>)}</select></label>
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>Appliquer les filtres</Button>
        <Button type="button" variant="secondary" onClick={() => startTransition(() => router.push(pathname))} disabled={isPending}>Réinitialiser</Button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{isPending ? "Mise à jour de ta liste…" : ""}</p>
    </form>
  );
}
