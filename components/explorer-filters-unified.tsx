"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useTransition } from "react";

import { Accordion } from "@/components/accordion";
import { Button } from "@/components/ui";
import styles from "./explorer-filters.module.css";

interface FilterOption {
  id: string;
  label: string;
  detail?: string;
  role?: "actor" | "director";
}

interface ExplorerFiltersProps {
  services: FilterOption[];
  genres: FilterOption[];
  people: FilterOption[];
  companies: FilterOption[];
  isAuthenticated: boolean;
}

export function ExplorerFiltersUnified({ services, genres, people, companies, isAuthenticated }: ExplorerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    formRef.current?.reset();
  }, [searchParamsKey]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.name && submitter.value.trim()) {
      params.set(submitter.name, submitter.value.trim());
    }

    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <form key={searchParamsKey} ref={formRef} className={styles.filters} onSubmit={submit} role="search" aria-label="Filtrer le catalogue" aria-busy={isPending}>
      <label className={styles.searchField}>
        <span>Rechercher un titre, un acteur ou un réalisateur</span>
        <input name="q" type="search" placeholder="Ex. Dune, Denis Villeneuve..." defaultValue={searchParams.get("q") ?? ""} />
      </label>
      {people.length > 0 && <div className={styles.suggestions} aria-label="Personnes trouvées"><span>Personnes trouvées</span>{people.map((person) => <button className={styles.suggestion} key={person.id} type="submit" name="personId" value={`${person.id}:${person.role ?? "actor"}`}>{person.label}{person.detail ? ` · ${person.detail}` : ""}</button>)}</div>}
      {companies.length > 0 && <div className={styles.suggestions} aria-label="Sociétés trouvées"><span>Sociétés trouvées</span>{companies.map((company) => <button className={styles.suggestion} key={company.id} type="submit" name="companyId" value={company.id}>{company.label}{company.detail ? ` · ${company.detail}` : ""}</button>)}</div>}

      <Accordion className={styles.advancedAccordion}>
        <Accordion.Item value="advanced-search">
          <Accordion.Control>Recherche avancée</Accordion.Control>
          <Accordion.Panel>
            <div className={styles.advancedGrid}>
              <label><span>Type</span><select name="type" defaultValue={searchParams.get("type") ?? "all"}><option value="all">Tous</option><option value="movie">Films</option><option value="tv">Séries</option></select></label>
              <label><span>Service</span><select name="service" defaultValue={searchParams.get("service") ?? (isAuthenticated ? "active" : "all")}><option value="active">Tous mes services</option><option value="all">Toutes les plateformes</option>{services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}</select></label>
              <label><span>Coût</span><select name="cost" defaultValue={searchParams.get("cost") ?? "free"}><option value="free">Gratuit / inclus</option><option value="paid">Payant</option><option value="all">Tous</option></select></label>
              <label><span>Origine</span><select name="quebec" defaultValue={searchParams.get("quebec") ?? "false"}><option value="false">Tous les contenus</option><option value="true">Contenu québécois</option></select></label>
              <label><span>Genre</span><select name="genre" defaultValue={searchParams.get("genre") ?? "all"}><option value="all">Tous les genres</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.label}</option>)}</select></label>
              <label><span>Note TMDB minimale</span><select name="minRating" defaultValue={searchParams.get("minRating") ?? "all"}><option value="all">Toutes les notes</option><option value="6">6 / 10 et plus</option><option value="7">7 / 10 et plus</option><option value="8">8 / 10 et plus</option><option value="9">9 / 10 et plus</option></select></label>
              <label><span>Année de sortie</span><input name="year" type="number" min="1900" max={new Date().getFullYear()} placeholder="Ex. 2024" defaultValue={searchParams.get("year") ?? ""} /></label>
              <label><span>Trier par</span><select name="sort" defaultValue={searchParams.get("sort") ?? "popularity"}><option value="popularity">Popularité</option><option value="rating">Note la plus haute</option><option value="newest">Date la plus récente</option><option value="oldest">Date la plus ancienne</option></select></label>
              <label><span>Mon statut</span><select name="status" defaultValue={searchParams.get("status") ?? "all"}><option value="all">Tous</option><option value="to_watch">À voir</option><option value="in_progress">En cours</option><option value="watched">Vu</option><option value="abandoned">Abandonné</option><option value="not_interested">Pas intéressé</option></select></label>
              <label><span>Ma note</span><select name="personalRating" defaultValue={searchParams.get("personalRating") ?? "all"}><option value="all">Toutes mes notes</option><option value="bad">Mauvais</option><option value="okay">Correct</option><option value="good">Bon</option><option value="very_good">Très bon</option><option value="masterpiece">Chef-d’œuvre</option></select></label>
              <label><span>Recommandation</span><select name="recommended" defaultValue={searchParams.get("recommended") ?? "all"}><option value="all">Toutes les recommandations</option><option value="true">Recommandé par un ami (Bon et +)</option></select></label>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>Appliquer les filtres</Button>
        <Button type="button" variant="secondary" onClick={() => startTransition(() => router.push(pathname))} disabled={isPending}>Réinitialiser</Button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{isPending ? "Mise à jour du catalogue…" : ""}</p>
    </form>
  );
}
