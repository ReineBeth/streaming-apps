import { redirect } from "next/navigation";

import { toggleStreamingService } from "@/app/settings/actions";
import { SubmitButton } from "@/components/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const [{ data: services, error: servicesError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
    supabase.from("streaming_services").select("id, name, logo_path").order("name"),
    supabase.from("user_streaming_services").select("streaming_service_id, active"),
  ]);

  if (servicesError || subscriptionsError) {
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
