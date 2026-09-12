import { redirect } from "next/navigation";

import { toggleFriendExclusion, toggleStreamingService, updateDisplayName } from "@/app/settings/actions";
import { SubmitButton } from "@/components/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const [{ data: profile, error: profileError }, { data: friendProfiles, error: friendProfilesError }, { data: services, error: servicesError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.rpc("list_friend_profiles"),
    supabase.from("streaming_services").select("id, name, logo_path").order("name"),
    supabase.from("user_streaming_services").select("streaming_service_id, active"),
  ]);

  if (profileError || friendProfilesError || servicesError || subscriptionsError) {
    return <main className={styles.page}><p className={styles.message} role="alert">Impossible de charger tes services.</p></main>;
  }

  const activeServiceIds = new Set(
    subscriptions.filter((subscription) => subscription.active).map((subscription) => subscription.streaming_service_id),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Paramètres</p>
        <h1>Mes services</h1>
        <p>Choisis les plateformes que tu utilises pour personnaliser ton catalogue.</p>
      </header>

      <section className={styles.profile} aria-labelledby="profile-title">
        <div>
          <h2 id="profile-title">Mon profil</h2>
          <p>Ce nom pourra être affiché à tes amis.</p>
        </div>
        <form className={styles.profileForm} action={updateDisplayName}>
          <label htmlFor="displayName">Mon nom</label>
          <div className={styles.profileControls}>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={profile?.display_name ?? ""}
              maxLength={80}
              required
              autoComplete="nickname"
            />
            <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
          </div>
        </form>
      </section>

      <section className={styles.friends} aria-labelledby="friends-title">
        <div>
          <h2 id="friends-title">Amis et recommandations</h2>
          <p>Tous les comptes sont inclus par défaut dans tes recommandations. Tu peux retirer un compte ici.</p>
        </div>
        {friendProfiles.length > 0 ? <div className={styles.friendList}>{friendProfiles.map((friend) => <article className={styles.friend} key={friend.id}><span>{friend.display_name?.trim() || "Utilisateur sans nom"}</span><form action={toggleFriendExclusion}><input type="hidden" name="friendId" value={friend.id} /><input type="hidden" name="excluded" value={String(!friend.is_excluded)} /><SubmitButton variant="secondary" pendingLabel="Mise à jour…">{friend.is_excluded ? "Ajouter à mes amis" : "Retirer de mes amis"}</SubmitButton></form></article>)}</div> : <p className={styles.emptyFriends}>Aucun autre compte n&apos;est disponible pour le moment.</p>}
      </section>

      <section className={styles.list} aria-label="Services de streaming">
        {services.map((service) => {
          const isActive = activeServiceIds.has(service.id);

          return (
            <article className={styles.service} key={service.id}>
              <div>
                <h2>{service.name}</h2>
                <p>{isActive ? "Inclus dans ton catalogue" : "Masqué de ton catalogue"}</p>
              </div>
              <form action={toggleStreamingService}>
                <input type="hidden" name="serviceId" value={service.id} />
                <input type="hidden" name="active" value={String(!isActive)} />
                <SubmitButton className={styles.serviceButton} pendingLabel="Mise à jour…" variant={isActive ? "primary" : "secondary"}>
                  {isActive ? "Actif" : "Activer"}
                </SubmitButton>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
