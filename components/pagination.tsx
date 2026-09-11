import Link from "next/link";

import { getPaginationItems } from "@/lib/pagination";

import styles from "./pagination.module.css";

export function Pagination({ current, total, getHref }: { current: number; total: number; getHref: (page: number) => string }) {
  if (total <= 1) return null;

  const link = (page: number, label: string) => page === current
    ? <span className={`${styles.control} ${styles.disabled}`} aria-disabled="true">{label}</span>
    : <Link className={styles.control} href={getHref(page)} aria-label={label}>{label}</Link>;

  return (
    <nav className={styles.pagination} aria-label="Pagination du catalogue">
      <div className={styles.controls}>
        {link(Math.max(1, current - 1), "Précédente")}
        <div className={styles.numberRow}>
          <ol className={styles.pages}>
          {getPaginationItems(total, current, 1, 2).map((item) => item === "ellipsis-left" || item === "ellipsis-right"
            ? <li className={styles.ellipsis} key={item} aria-hidden="true">…</li>
            : <li key={item}>{item === current ? <span className={`${styles.control} ${styles.current}`} aria-current="page">{item}</span> : <Link className={styles.control} href={getHref(item)} aria-label={`Page ${item}`}>{item}</Link>}</li>)}
          </ol>
        </div>
        <div className={styles.navigation}>{link(Math.min(total, current + 1), "Suivante")}</div>
      </div>
      <p className={styles.summary}>Page {current} sur {total}</p>
    </nav>
  );
}
