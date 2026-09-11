import Link from "next/link";

import styles from "./state.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>404</p>
        <h1>Cette page n&apos;existe pas</h1>
        <p>Le titre demandé est introuvable ou le lien n&apos;est plus valide.</p>
        <Link className={styles.action} href="/explorer">Retourner au catalogue</Link>
      </section>
    </main>
  );
}
