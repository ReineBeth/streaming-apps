import Link from "next/link";

import styles from "./page.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AccountConfirmedPage({ searchParams }: { searchParams: SearchParams }) {
  const hasError = first((await searchParams).error) === "confirmation_failed";

  return (
    <main className={styles.page}>
      <section className={styles.card} role={hasError ? "alert" : "status"}>
        <p className={styles.eyebrow}>Streaming Apps</p>
        {hasError ? <><h1>Confirmation impossible</h1><p>Le lien de confirmation est invalide ou a déjà été utilisé. Tu peux demander un nouveau courriel ou te connecter si le compte est déjà confirmé.</p></> : <><h1>Compte confirmé</h1><p>La création de ton compte est terminée. Tu peux maintenant te connecter et commencer ton catalogue.</p></>}
        <Link className={styles.link} href="/login">{hasError ? "Retour à la connexion" : "Se connecter"}</Link>
      </section>
    </main>
  );
}
