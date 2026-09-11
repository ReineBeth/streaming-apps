"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import styles from "./login-form.module.css";

function getSafeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/explorer";
}

function getSignInErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
    return "Confirme ton adresse courriel avec le lien reçu avant de te connecter.";
  }

  return "Adresse courriel ou mot de passe invalide.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let signInError: Error | null = null;

    try {
      const result = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      signInError = result.error;
    } catch {
      setError("Impossible de joindre Supabase. Vérifie l’URL du projet et redémarre le serveur.");
      setIsSubmitting(false);
      return;
    }

    if (signInError) {
      setError(getSignInErrorMessage(signInError));
      setIsSubmitting(false);
      return;
    }

    router.replace(getSafeNextPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Streaming Apps</p>
        <h1>Se connecter</h1>
        <p className={styles.intro}>Retrouve ton catalogue personnel et tes abonnements.</p>

        <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className={styles.field}>
            <label htmlFor="email">Adresse courriel</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error ? <p className={styles.error} role="alert" aria-live="assertive">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </section>
  );
}
