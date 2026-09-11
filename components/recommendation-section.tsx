"use client";

import { useEffect, useMemo, useState } from "react";

import type { CatalogTitleSummary } from "@/types/domain";
import { MediaCard } from "@/components/media-card";

import styles from "./recommendation-section.module.css";

const PAGE_SIZE = 6;

export function RecommendationSection({ titles, storageKey }: { titles: CatalogTitleSummary[]; storageKey: string }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(0);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let ids: string[] = [];
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) ids = JSON.parse(stored) as string[];
    } catch {
      // Ignore unavailable or malformed local storage data.
    }
    const timeoutId = window.setTimeout(() => {
      setDismissedIds(new Set(ids));
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);
  const availableTitles = useMemo(() => titles.filter((title) => !dismissedIds.has(`${title.mediaType}:${title.tmdbId}`)), [dismissedIds, titles]);
  if (!isReady || availableTitles.length === 0) return null;

  const pageCount = Math.ceil(availableTitles.length / PAGE_SIZE);
  const currentPage = page % pageCount;
  const visibleTitles = availableTitles.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function dismiss(title: CatalogTitleSummary) {
    const id = `${title.mediaType}:${title.tmdbId}`;
    setDismissedIds((current) => {
      const next = new Set(current).add(id);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // Dismissing still works for the current render when storage is unavailable.
      }
      return next;
    });
  }

  return (
    <section className={styles.section} aria-labelledby="recommendations-title">
      <div className={styles.header}>
        <h2 id="recommendations-title">Suggestions pour toi</h2>
        {pageCount > 1 && <button type="button" className={styles.reloadButton} onClick={() => setPage((current) => current + 1)}>Nouvelles suggestions</button>}
      </div>
      <div className={styles.grid}>
        {visibleTitles.map((title, index) => <MediaCard key={`${title.mediaType}-${title.tmdbId}`} title={title} priority={index === 0} onDismiss={() => dismiss(title)} />)}
      </div>
    </section>
  );
}
