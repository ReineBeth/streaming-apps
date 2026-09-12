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

  if (error.code === "over_email_send_rate_limit" || error.code === "email_rate_limit_exceeded" || error.message.toLowerCase().includes("email rate limit") || error.message.toLowerCase().includes("rate limit exceeded")) {
    return "Supabase a atteint sa limite d’envoi de courriels. Attends un peu avant de redemander une confirmation, ou configure un SMTP personnalisé dans Supabase.";
  }

  return "Adresse courriel ou mot de passe invalide.";
}

function getSignUpErrorMessage(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();
  if (error.code === "over_email_send_rate_limit" || error.code === "email_rate_limit_exceeded" || message.includes("email rate limit") || message.includes("rate limit exceeded")) {
    return "La limite d’envoi de courriels de Supabase est atteinte. Attends avant de réessayer, ou configure un SMTP personnalisé dans Supabase.";
  }

  if (error.code === "user_already_exists" || message.includes("already registered") || message.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse courriel.";
  }

  return "Impossible de créer le compte. Vérifie l'adresse courriel et le mot de passe.";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error("AUTH_REQUEST_TIMEOUT")), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = mode === "signin"
        ? await withTimeout(supabase.auth.signInWithPassword({ email, password }), 15000)
        : await withTimeout(supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Faccount-confirmed` },
        }), 15000);

      if (result.error) {
        setError(mode === "signin" ? getSignInErrorMessage(result.error) : getSignUpErrorMessage(result.error));
        setIsSubmitting(false);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Compte créé. Un courriel de confirmation a été envoyé. Clique sur le lien reçu pour terminer la création de ton compte.");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      setError(error instanceof Error && error.message === "AUTH_REQUEST_TIMEOUT"
        ? "La connexion prend trop de temps. Vérifie ta connexion Internet et réessaie."
        : "Impossible de joindre Supabase. Vérifie l'URL du projet et réessaie.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.replace(getSafeNextPath(searchParams.get("next")));
    router.refresh();
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPasswordConfirmation("");
  }

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Streaming Apps</p>
        <h1>{mode === "signin" ? "Se connecter" : "Créer un compte"}</h1>
        <p className={styles.intro}>{mode === "signin" ? "Retrouve ton catalogue personnel et tes abonnements." : "Crée un catalogue séparé pour chaque personne."}</p>

        <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className={styles.field}>
            <label htmlFor="email">Adresse courriel</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {mode === "signup" ? <div className={styles.field}>
            <label htmlFor="passwordConfirmation">Confirmer le mot de passe</label>
            <input id="passwordConfirmation" type="password" autoComplete="new-password" minLength={6} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
          </div> : null}
          {error ? <p className={styles.error} role="alert" aria-live="assertive">{error}</p> : null}
          {message ? <p className={styles.success} role="status" aria-live="polite">{message}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Patiente un instant…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <div className={styles.modeSwitch}>
          {mode === "signin" ? <>
            <span>Pas encore de compte ?</span>
            <button type="button" onClick={() => switchMode("signup")}>Créer un compte</button>
          </> : <>
            <span>Tu as déjà un compte ?</span>
            <button type="button" onClick={() => switchMode("signin")}>Se connecter</button>
          </>}
        </div>
      </div>
    </section>
  );
}
