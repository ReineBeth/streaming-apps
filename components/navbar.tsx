"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import styles from "./navbar.module.css";

const links = [["/", "Accueil"], ["/explorer", "Explorer"], ["/roulette", "Roulette"], ["/watchlist", "À voir"], ["/history", "Historique"], ["/settings", "Paramètres"]] as const;

export function Navbar() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpened(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [opened]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  function closeMenu() {
    setOpened(false);
  }

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    closeMenu();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/" onClick={closeMenu}>Streaming Apps</Link>
      <button
        className={`${styles.burger} ${opened ? styles.burgerOpened : ""}`}
        type="button"
        aria-label={opened ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={opened}
        aria-controls="mobile-navigation"
        onClick={() => setOpened((value) => !value)}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          {opened ? <><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></> : <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>}
        </svg>
      </button>
      <nav className={styles.desktopNav} aria-label="Navigation principale">
        <ul className={styles.list}>{links.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}{email ? <li><button className={styles.authButton} type="button" onClick={signOut}>Se déconnecter</button></li> : <li><Link href="/login">Se connecter</Link></li>}</ul>
      </nav>
      <div className={`${styles.overlay} ${opened ? styles.overlayVisible : ""}`} aria-hidden="true" onClick={closeMenu} />
      <nav id="mobile-navigation" className={`${styles.mobileNav} ${opened ? styles.mobileNavOpened : ""}`} aria-label="Navigation mobile" aria-hidden={!opened}>
        <ul className={styles.mobileList}>{links.map(([href, label]) => <li key={href}><Link href={href} tabIndex={opened ? 0 : -1} onClick={closeMenu}>{label}</Link></li>)}{email ? <li><button className={styles.authButton} type="button" tabIndex={opened ? 0 : -1} onClick={signOut}>Se déconnecter</button></li> : <li><Link href="/login" tabIndex={opened ? 0 : -1} onClick={closeMenu}>Se connecter</Link></li>}</ul>
      </nav>
    </header>
  );
}
