import Image from "next/image";
import Link from "next/link";

import type { CatalogTitleSummary } from "@/types/domain";

import styles from "./roulette-history.module.css";

const IMAGE_URL = "https://image.tmdb.org/t/p/w300";

export function RouletteHistory({ titles }: { titles: CatalogTitleSummary[] }) {
  if (titles.length === 0) return null;

  return (
    <section className={styles.history} aria-labelledby="roulette-history-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Session en cours</p>
          <h2 id="roulette-history-title">Historique des tirages</h2>
        </div>
        <span>{titles.length} tirage{titles.length > 1 ? "s" : ""}</span>
      </div>
      <ol className={styles.list} aria-label="Titres tirés">
        {titles.map((title) => (
          <li key={`${title.mediaType}:${title.tmdbId}`} className={styles.entry}>
            {title.posterPath ? <Image src={`${IMAGE_URL}${title.posterPath}`} alt="" width={48} height={72} /> : <div className={styles.posterFallback} aria-hidden="true">?</div>}
            <div>
              <p className={styles.type}>{title.mediaType === "movie" ? "Film" : "Série"}</p>
              <Link href={`/titles/${title.mediaType}/${title.tmdbId}`}>{title.title}</Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
