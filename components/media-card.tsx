"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { CatalogTitleSummary } from "@/types/domain";
import { TitleStatusForm } from "@/components/title-status-form";

import styles from "./media-card.module.css";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function formatYear(year: number | null): string {
  return year ? String(year) : "Année inconnue";
}

const statusLabels = {
  to_watch: "À voir",
  in_progress: "En cours",
  watched: "Vu",
  abandoned: "Abandonné",
  not_interested: "Pas intéressé",
} as const;

export function MediaCard({ title, priority = false, onDismiss }: { title: CatalogTitleSummary; priority?: boolean; onDismiss?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mediaLabel = title.mediaType === "movie" ? "Film" : "Série";

  useEffect(() => {
    if (!isOpen) return;

    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    closeButtonRef.current?.focus();
  }, [isOpen]);

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <article className={styles.card}>
        <button ref={cardButtonRef} type="button" className={styles.cardButton} onClick={() => setIsOpen(true)} aria-label={`Voir les détails de ${title.title}`}>
          <div className={styles.poster}>
            {title.posterPath ? <Image src={`${TMDB_IMAGE_BASE_URL}${title.posterPath}`} alt={`Affiche de ${title.title}`} fill priority={priority} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px" /> : <span className={styles.posterFallback} aria-hidden="true">Pas d’affiche</span>}
            {title.status && <span className={styles.statusBadge}>{statusLabels[title.status]}</span>}
          </div>
          <div className={styles.details}>
            <h2>{title.title}</h2>
            {title.recommendationReason && <p className={styles.recommendationReason}>{title.recommendationReason}</p>}
            <p>{formatYear(title.year)} · {mediaLabel}</p>
            <p className={styles.rating} aria-label={`Note TMDB ${title.tmdbRating?.toFixed(1) ?? "indisponible"} sur 10`}>★ {title.tmdbRating?.toFixed(1) ?? "—"}</p>
            {title.status === "watched" && title.personalRating !== null && <p className={styles.personalRating}>Ma note : {title.personalRating === "bad" ? "Mauvais" : title.personalRating === "okay" ? "Correct" : title.personalRating === "good" ? "Bon" : title.personalRating === "very_good" ? "Très bon" : "Chef-d’œuvre"}</p>}
            {title.mediaType === "tv" && title.seasonRatings.length > 0 && <p className={styles.seasonRatings} aria-label="Notes personnelles des saisons">{title.seasonRatings.map((season) => <span className={styles.seasonRating} key={season.seasonNumber}>S{season.seasonNumber} : {season.rating === "bad" ? "Mauvais" : season.rating === "okay" ? "Correct" : season.rating === "good" ? "Bon" : season.rating === "very_good" ? "Très bon" : "Chef-d’œuvre"}</span>)}</p>}
            <span className={styles.providers} aria-label="Plateformes disponibles au Canada">
              {title.providers.map((provider) => <span className={styles.provider} key={provider.id}>{provider.name}{provider.isPaid && <span className={styles.paid} title="Disponible avec un achat ou une location">$<span className={styles.srOnly}> achat ou location requis</span></span>}</span>)}
            </span>
          </div>
        </button>
        {onDismiss && <button type="button" className={styles.dismissButton} onClick={onDismiss}>Masquer</button>}
      </article>

      {isOpen && (
        <dialog ref={dialogRef} className={styles.modal} aria-labelledby={`title-${title.mediaType}-${title.tmdbId}`} aria-describedby={`description-${title.mediaType}-${title.tmdbId}`} onCancel={closeModal} onClose={() => { setIsOpen(false); cardButtonRef.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
            <button ref={closeButtonRef} type="button" className={styles.closeButton} onClick={closeModal} aria-label="Fermer les détails">×</button>
            <div className={styles.modalContent}>
              {title.posterPath && <Image className={styles.modalPoster} src={`${TMDB_IMAGE_BASE_URL}${title.posterPath}`} alt="" width={220} height={330} />}
              <div className={styles.modalDetails}>
                <p className={styles.eyebrow}>{mediaLabel} · {formatYear(title.year)}</p>
                <h2 id={`title-${title.mediaType}-${title.tmdbId}`}>{title.title}</h2>
                <p className={styles.modalRating}>★ {title.tmdbRating?.toFixed(1) ?? "—"} / 10 TMDB</p>
                <p id={`description-${title.mediaType}-${title.tmdbId}`} className={styles.overview}>{title.overview || "Aucune description disponible."}</p>
                <TitleStatusForm key={`${title.mediaType}-${title.tmdbId}-${title.status ?? "none"}`} tmdbId={title.tmdbId} mediaType={title.mediaType} status={title.status} rating={title.personalRating} />
              </div>
            </div>
            <Link className={styles.detailsLink} href={`/titles/${title.mediaType}/${title.tmdbId}`} onClick={closeModal}>{title.mediaType === "tv" ? "Ouvrir le suivi des saisons" : "Voir la fiche complète"}</Link>
        </dialog>
      )}
    </>
  );
}
