import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getActiveTmdbProviderIds(): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("user_streaming_services")
    .select("streaming_service_id")
    .eq("active", true);

  if (subscriptionsError) {
    throw new Error("Unable to load active streaming services");
  }

  const serviceIds = subscriptions.map((subscription) => subscription.streaming_service_id);

  if (serviceIds.length === 0) {
    return [];
  }

  const { data: services, error: servicesError } = await supabase
    .from("streaming_services")
    .select("tmdb_provider_id")
    .in("id", serviceIds);

  if (servicesError) {
    throw new Error("Unable to load streaming provider ids");
  }

  return services.map((service) => service.tmdb_provider_id);
}

export async function getTitleProviderAudioLanguages(
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<Record<number, string[]>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("title_provider_audio")
    .select("tmdb_provider_id, audio_languages")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    throw new Error("Unable to load title provider audio languages");
  }

  return Object.fromEntries((data ?? []).map((row) => [row.tmdb_provider_id, row.audio_languages]));
}

export async function getTitleProviderAudioLanguagesForTitles(
  titles: Array<{ tmdbId: number; mediaType: "movie" | "tv" }>,
): Promise<Map<string, Record<number, string[]>>> {
  const uniqueTitles = Array.from(new Map(titles.map((title) => [`${title.mediaType}:${title.tmdbId}`, title])).values());
  if (uniqueTitles.length === 0) return new Map();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("title_provider_audio")
    .select("tmdb_id, media_type, tmdb_provider_id, audio_languages")
    .in("tmdb_id", uniqueTitles.map((title) => title.tmdbId))
    .in("media_type", Array.from(new Set(uniqueTitles.map((title) => title.mediaType))));

  if (error) throw new Error("Unable to load title provider audio languages");

  const result = new Map<string, Record<number, string[]>>();
  for (const row of data ?? []) {
    const key = `${row.media_type}:${row.tmdb_id}`;
    const titleLanguages = result.get(key) ?? {};
    titleLanguages[row.tmdb_provider_id] = row.audio_languages;
    result.set(key, titleLanguages);
  }
  return result;
}
