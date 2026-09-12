"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitSharedMovieVote } from "@/app/tinder-movie/actions";
import { getCommonTitleKeys } from "@/lib/tinder-movie/session";
import type { SharedSessionPayload } from "@/lib/tinder-movie/server";
import { Button, TextLink } from "@/components/ui";

import styles from "./shared-session-board.module.css";

const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

export function SharedSessionBoard({ accessToken, participantToken, shareUrl, session }: { accessToken: string; participantToken: string; shareUrl: string; session: SharedSessionPayload }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const startX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const participantIds = session.participants.map((participant) => participant.id);
  const ownVotes = new Map(session.votes.filter((vote) => vote.participant_id === session.participant.id).map((vote) => [`${vote.media_type}:${vote.tmdb_id}`, vote]));
  const firstVotes = new Set(session.votes.filter((vote) => vote.participant_id === participantIds[0] && vote.liked).map((vote) => `${vote.media_type}:${vote.tmdb_id}`));
  const secondVotes = new Set(session.votes.filter((vote) => vote.participant_id === participantIds[1] && vote.liked).map((vote) => `${vote.media_type}:${vote.tmdb_id}`));
  const completed = session.participants.length === 2 && session.participants.every((participant) => participant.completed);
  const commonKeys = completed ? getCommonTitleKeys(session.titles, firstVotes, secondVotes) : [];
  const currentTitle = session.titles.find((title) => !ownVotes.has(`${title.mediaType}:${title.tmdbId}`));
  const commonTitles = session.titles.filter((title) => commonKeys.includes(`${title.mediaType}:${title.tmdbId}`));

  useEffect(() => {
    if (!completed && session.participants.some((participant) => participant.id === session.participant.id && participant.completed)) {
      const timer = window.setInterval(() => router.refresh(), 4000);
      return () => window.clearInterval(timer);
    }
  }, [completed, router, session.participant.id, session.participants]);

  function vote(liked: boolean) {
    if (!currentTitle || isPending) return;
    const formData = new FormData();
    formData.set("accessToken", accessToken);
    formData.set("participantToken", participantToken);
    formData.set("tmdbId", String(currentTitle.tmdbId));
    formData.set("mediaType", currentTitle.mediaType);
    formData.set("liked", String(liked));
    setSwipeOffset(liked ? 500 : -500);
    startTransition(async () => {
      await submitSharedMovieVote(formData);
      setSwipeOffset(0);
      router.refresh();
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(distance) >= 80) vote(distance > 0);
  }

  const progress = session.titles.length - session.titles.filter((title) => ownVotes.has(`${title.mediaType}:${title.tmdbId}`)).length;
  const otherParticipant = session.participants.find((participant) => participant.id !== session.participant.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Session partagée</p>
        <h1>Choisissez ensemble</h1>
        <p>Connecté en tant que <strong>{session.participant.display_name}</strong>.</p>
      </header>

      {!otherParticipant ? <section className={styles.waiting} role="status"><h2>En attente de l&apos;autre participant</h2><p>Partage ce lien avec l&apos;autre personne pour commencer.</p><div className={styles.shareControls}><input readOnly value={shareUrl} aria-label="Lien de la session" /><Button type="button" variant="secondary" onClick={() => { void navigator.clipboard.writeText(shareUrl); setCopied(true); }}>Copier</Button></div>{copied && <p role="status">Lien copié.</p>}</section> : completed ? <Results titles={commonTitles} /> : currentTitle ? <section className={styles.swipeArea} aria-labelledby="swipe-title"><div className={styles.progress}><span id="swipe-title">{progress} titre{progress > 1 ? "s" : ""} restant{progress > 1 ? "s" : ""}</span><span>{session.participants.filter((participant) => participant.completed).length}/2 terminé</span></div><article className={styles.card} style={{ transform: `translateX(${swipeOffset}px) rotate(${swipeOffset / 18}deg)` }} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} aria-label="Carte à évaluer"><div className={styles.poster}>{currentTitle.posterPath ? <Image src={`${IMAGE_URL}${currentTitle.posterPath}`} alt={`Affiche de ${currentTitle.title}`} fill sizes="(max-width: 640px) 88vw, 28rem" priority /> : <span aria-hidden="true">Pas d&apos;affiche</span>}</div><div className={styles.cardContent}><p>{currentTitle.mediaType === "movie" ? "Film" : "Série"}{currentTitle.year ? ` · ${currentTitle.year}` : ""}</p><h2>{currentTitle.title}</h2><span>Note TMDB : {currentTitle.tmdbRating?.toFixed(1) ?? "—"}/10</span></div></article><div className={styles.voteActions}><Button type="button" variant="secondary" onClick={() => vote(false)} disabled={isPending} aria-label={`Passer ${currentTitle.title}`}>← Passer</Button><Button type="button" onClick={() => vote(true)} disabled={isPending} aria-label={`Aimer ${currentTitle.title}`}>J&apos;aime →</Button></div><p className={styles.hint}>Glisse la carte vers la gauche ou la droite, ou utilise les boutons.</p></section> : <section className={styles.waiting} role="status"><h2>Tu as terminé</h2><p>Attends que {otherParticipant.display_name} termine sa sélection.</p></section>}
    </main>
  );
}

function Results({ titles }: { titles: SharedSessionPayload["titles"] }) {
  return <section className={styles.results} aria-labelledby="results-title"><p className={styles.eyebrow}>Résultat</p><h2 id="results-title">Vos titres en commun</h2>{titles.length > 0 ? <div className={styles.resultList}>{titles.map((title) => <article className={styles.result} key={`${title.mediaType}:${title.tmdbId}`}>{title.posterPath ? <Image src={`${IMAGE_URL}${title.posterPath}`} alt={`Affiche de ${title.title}`} width={92} height={138} /> : <div className={styles.resultFallback}>?</div>}<div><p>{title.mediaType === "movie" ? "Film" : "Série"}</p><h3>{title.title}</h3><TextLink href={`/titles/${title.mediaType}/${title.tmdbId}`}>Voir la fiche</TextLink></div></article>)}</div> : <p>Aucun titre n&apos;a été aimé par les deux participants.</p>}</section>;
}
