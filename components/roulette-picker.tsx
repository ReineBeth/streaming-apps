"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { getTitleKey, pickRandomTitle } from "@/lib/roulette/selection";
import type { CatalogTitleSummary } from "@/types/domain";
import { Button, TextLink } from "@/components/ui";

import { RouletteHistory } from "./roulette-history";
import styles from "./roulette-picker.module.css";

const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const ROLL_DURATION_MS = 900;

export function RoulettePicker({ candidates }: { candidates: CatalogTitleSummary[] }) {
  const [drawnIds, setDrawnIds] = useState<Set<string>>(() => new Set());
  const [history, setHistory] = useState<CatalogTitleSummary[]>([]);
  const [current, setCurrent] = useState<CatalogTitleSummary | null>(null);
  const [rollingTitle, setRollingTitle] = useState<CatalogTitleSummary | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function draw() {
    if (isRolling) return;

    const selected = pickRandomTitle(candidates, drawnIds);
    if (!selected) {
      setCurrent(null);
      return;
    }

    if (reducedMotion) {
      setCurrent(selected);
      setHistory((previous) => [selected, ...previous]);
      setDrawnIds((previous) => new Set(previous).add(getTitleKey(selected)));
      return;
    }

    setRollingTitle(selected);
    setIsRolling(true);
    timerRef.current = window.setTimeout(() => {
      setCurrent(selected);
      setRollingTitle(null);
      setHistory((previous) => [selected, ...previous]);
      setDrawnIds((previous) => new Set(previous).add(getTitleKey(selected)));
      setIsRolling(false);
      timerRef.current = null;
    }, ROLL_DURATION_MS);
  }

  const exhausted = drawnIds.size >= candidates.length;

  return (
    <section className={styles.wrapper} aria-labelledby="roulette-draw-title">
      <div className={styles.drawPanel}>
        <div className={styles.drawHeading}>
          <div>
            <p className={styles.eyebrow}>Le hasard décide</p>
            <h2 id="roulette-draw-title">Quel sera le prochain titre ?</h2>
          </div>
          <span className={styles.remaining}>{Math.max(candidates.length - drawnIds.size, 0)} restant{candidates.length - drawnIds.size > 1 ? "s" : ""}</span>
        </div>
        <p className={styles.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
          {isRolling ? "La roulette choisit un titre." : current ? `Titre sélectionné : ${current.title}.` : ""}
        </p>
        <div className={`${styles.result} ${isRolling ? styles.rolling : ""}`} aria-busy={isRolling}>
          {isRolling && rollingTitle ? <RollingDisplay title={rollingTitle} /> : current ? <ResultCard title={current} /> : <p className={styles.placeholder}>Lance la roulette pour découvrir ton prochain film ou ta prochaine série.</p>}
        </div>
        <div className={styles.actions}>
          <Button type="button" onClick={draw} disabled={isRolling || exhausted}>{current ? "Relancer" : "Lancer la roulette"}</Button>
          {exhausted && <p role="status">Tous les titres de cette session ont été tirés. Modifie les filtres pour recommencer.</p>}
        </div>
      </div>
      <RouletteHistory titles={history} />
    </section>
  );
}

function RollingDisplay({ title }: { title: CatalogTitleSummary }) {
  return (
    <div className={styles.rollingDisplay} aria-hidden="true">
      <div className={styles.revealStage}>
        <div className={styles.revealCard}>
          <div className={styles.cardFace + " " + styles.cardBack}><span>?</span></div>
          <div className={styles.cardFace + " " + styles.cardFront}>
            {title.posterPath ? <Image src={`${IMAGE_URL}${title.posterPath}`} alt="" width={180} height={270} /> : <span className={styles.cardPosterFallback}>{title.title.slice(0, 1)}</span>}
            <div className={styles.cardFrontInfo}>
              <strong>{title.title}</strong>
              <span>{title.mediaType === "movie" ? "Film" : "Série"}{title.year ? ` · ${title.year}` : ""}</span>
              <span>★ {title.tmdbRating?.toFixed(1) ?? "—"} / 10</span>
            </div>
          </div>
        </div>
      </div>
      <p className={styles.status}>La carte arrive...</p>
    </div>
  );
}

function ResultCard({ title }: { title: CatalogTitleSummary }) {
  return (
    <article className={styles.resultCard}>
      {title.posterPath ? <Image src={`${IMAGE_URL}${title.posterPath}`} alt={`Affiche de ${title.title}`} width={180} height={270} priority /> : <div className={styles.resultFallback} aria-hidden="true">Pas d&apos;affiche</div>}
      <div className={styles.details}>
        <p className={styles.type}>{title.mediaType === "movie" ? "Film" : "Série"}{title.year ? ` · ${title.year}` : ""}</p>
        <h3>{title.title}</h3>
        <p className={styles.rating}>Note TMDB : {title.tmdbRating === null ? "Non notée" : `${title.tmdbRating.toFixed(1)} / 10`}</p>
        <TextLink href={`/titles/${title.mediaType}/${title.tmdbId}`}>Voir la fiche</TextLink>
      </div>
    </article>
  );
}
