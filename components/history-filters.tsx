import type { PersonalRating } from "@/types/domain";
import { Button, LinkButton } from "@/components/ui";

import styles from "./history-filters.module.css";

const ratings: Array<[PersonalRating, string]> = [["bad", "Mauvais"], ["okay", "Correct"], ["good", "Bon"], ["very_good", "Très bon"], ["masterpiece", "Chef-d’œuvre"]];

export function HistoryFilters({ type, rating, year }: { type: string; rating: string; year: string }) {
  return (
    <form className={styles.filters} method="get" aria-label="Filtrer mon historique">
      <label><span>Type</span><select name="type" defaultValue={type}><option value="all">Tous</option><option value="movie">Films</option><option value="tv">Séries</option></select></label>
      <label><span>Ma note</span><select name="rating" defaultValue={rating}><option value="all">Toutes mes notes</option>{ratings.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Année de visionnement</span><input name="year" type="number" min="1900" max={new Date().getFullYear()} placeholder="Ex. 2026" defaultValue={year} /></label>
      <Button type="submit">Appliquer les filtres</Button>
      <LinkButton href="/history" variant="secondary">Réinitialiser</LinkButton>
    </form>
  );
}
