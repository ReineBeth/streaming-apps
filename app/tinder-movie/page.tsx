import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/submit-button";
import { createSharedMovieSession } from "@/app/tinder-movie/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/tmdb/catalog";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function SharedMovieSessionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Ftinder-movie");

  const [{ data: profile }, genres] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    Promise.all([getGenres("movie"), getGenres("tv")]),
  ]);
  const genreOptions = Array.from(new Map(genres.flatMap((result) => result.genres).map((genre) => [genre.id, genre.name])).entries())
    .sort(([, first], [, second]) => first.localeCompare(second, "fr"));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>À deux</p>
        <h1>Tinder Movie</h1>
        <p>Choisis des films ou des séries avec une autre personne, même si elle n&apos;a pas de compte.</p>
      </header>

      <section className={styles.panel} aria-labelledby="create-session-title">
        <h2 id="create-session-title">Créer une session</h2>
        <p>Les deux participants recevront la même sélection de dix titres.</p>
        <form className={styles.form} action={createSharedMovieSession}>
          <label><span>Ton nom pour cette session</span><input name="displayName" defaultValue={profile?.display_name ?? ""} maxLength={40} required placeholder="Ex. Elisabeth" /></label>
          <label><span>Type</span><select name="type" defaultValue="all"><option value="all">Films et séries</option><option value="movie">Films</option><option value="tv">Séries</option></select></label>
          <label><span>Genre</span><select name="genre" defaultValue=""><option value="">Tous les genres</option>{genreOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label><span>Statut personnel</span><select name="status" defaultValue=""><option value="">Tous les statuts</option><option value="to_watch">À voir</option><option value="in_progress">En cours</option><option value="watched">Vu</option><option value="abandoned">Abandonné</option><option value="not_interested">Pas intéressé</option></select></label>
          <label><span>Note personnelle minimale</span><select name="minRating" defaultValue=""><option value="">Toutes les notes</option><option value="good">Bon et plus</option><option value="very_good">Très bon et plus</option><option value="masterpiece">Chef-d’œuvre</option></select></label>
          <SubmitButton pendingLabel="Création…">Créer et partager</SubmitButton>
        </form>
      </section>
    </main>
  );
}
