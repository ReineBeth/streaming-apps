"use client";

import { useEffect } from "react";

import styles from "./state.module.css";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application route error", error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <p className={styles.eyebrow}>Une erreur est survenue</p>
        <h1>Impossible d&apos;afficher cette page</h1>
        <p>Réessaie maintenant. Si le problème persiste, vérifie la connexion à Supabase ou à TMDB.</p>
        <button className={styles.action} type="button" onClick={() => reset()}>Réessayer</button>
      </section>
    </main>
  );
}
