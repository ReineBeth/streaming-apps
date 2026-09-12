import Link from "next/link";
import { headers } from "next/headers";

import { joinSharedMovieSession } from "@/app/tinder-movie/actions";
import { SharedSessionBoard } from "@/components/shared-session-board";
import { getSharedMovieSession } from "@/lib/tinder-movie/server";
import { Button } from "@/components/ui";

import styles from "../page.module.css";

type Params = Promise<{ accessToken: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SharedMovieSessionJoinPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { accessToken } = await params;
  const participantToken = first((await searchParams).participant);

  if (!participantToken) {
    return (
      <main className={styles.page}>
        <header className={styles.header}><p className={styles.eyebrow}>Invitation</p><h1>Rejoindre la session</h1><p>Choisis le nom qui sera visible pendant cette session.</p></header>
        <section className={styles.panel} aria-labelledby="join-session-title">
          <h2 id="join-session-title">Prêt à swiper ?</h2>
          <form className={styles.form} action={joinSharedMovieSession}>
            <input type="hidden" name="accessToken" value={accessToken} />
            <label><span>Ton nom</span><input name="displayName" maxLength={40} required autoFocus placeholder="Ex. Alex" /></label>
            <Button type="submit">Rejoindre la session</Button>
          </form>
        </section>
      </main>
    );
  }

  const session = await getSharedMovieSession(accessToken, participantToken);
  if (!session) {
    return <main className={styles.page}><section className={styles.panel}><h1>Session indisponible</h1><p>Ce lien est expiré, invalide ou la session est terminée.</p><Link href="/tinder-movie">Créer une nouvelle session</Link></section></main>;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const shareUrl = host ? `${protocol}://${host}/tinder-movie/${accessToken}` : `/tinder-movie/${accessToken}`;
  return <SharedSessionBoard accessToken={accessToken} participantToken={participantToken} shareUrl={shareUrl} session={session} />;
}
