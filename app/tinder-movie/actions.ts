"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseSharedSessionFilters, SHARED_SESSION_TTL_HOURS } from "@/lib/tinder-movie/session";
import { createSharedSessionTitles } from "@/lib/tinder-movie/server";
import type { Json } from "@/lib/supabase/database.types";

function randomToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

function readDisplayName(formData: FormData) {
  const value = formData.get("displayName");
  const displayName = typeof value === "string" ? value.trim() : "";
  if (displayName.length < 1 || displayName.length > 40) throw new Error("Le nom doit contenir entre 1 et 40 caractères.");
  return displayName;
}

export async function createSharedMovieSession(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Ftinder-movie");

  const filters = parseSharedSessionFilters(Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === "string") as Array<[string, string]>,
  ));
  const titles = await createSharedSessionTitles(filters);
  if (titles.length === 0) throw new Error("Aucun titre ne correspond à ces filtres et tes services actifs.");

  const accessToken = randomToken();
  const participantToken = randomToken();
  const expiresAt = new Date(Date.now() + SHARED_SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const displayName = readDisplayName(formData);
  const { data, error } = await supabase.rpc("create_shared_movie_session", {
    p_access_token: accessToken,
    p_participant_token: participantToken,
    p_display_name: displayName,
    p_filters: filters as unknown as Json,
    p_titles: titles.map((title) => ({
      position: title.position,
      tmdb_id: title.tmdbId,
      media_type: title.mediaType,
      title: title.title,
      overview: title.overview ?? "",
      year: title.year ?? null,
      poster_path: title.posterPath ?? null,
      tmdb_rating: title.tmdbRating ?? null,
    })) as unknown as Json,
    p_expires_at: expiresAt,
  });
  if (error || !data?.[0]) throw new Error("Impossible de créer la session.");

  redirect(`/tinder-movie/${accessToken}?participant=${participantToken}`);
}

export async function joinSharedMovieSession(formData: FormData) {
  const accessToken = formData.get("accessToken");
  if (typeof accessToken !== "string" || accessToken.length < 32 || accessToken.length > 128) throw new Error("Lien de session invalide.");
  const participantToken = randomToken();
  const displayName = readDisplayName(formData);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_shared_movie_session", {
    p_access_token: accessToken,
    p_participant_token: participantToken,
    p_display_name: displayName,
  });
  if (error || !data?.[0]) throw new Error("Impossible de rejoindre cette session.");
  redirect(`/tinder-movie/${accessToken}?participant=${participantToken}`);
}

export async function submitSharedMovieVote(formData: FormData) {
  const accessToken = formData.get("accessToken");
  const participantToken = formData.get("participantToken");
  const tmdbIdValue = formData.get("tmdbId");
  const mediaType = formData.get("mediaType");
  const liked = formData.get("liked");
  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  if (typeof accessToken !== "string" || typeof participantToken !== "string" || !Number.isInteger(tmdbId) || tmdbId <= 0 || (mediaType !== "movie" && mediaType !== "tv") || (liked !== "true" && liked !== "false")) {
    throw new Error("Vote de session invalide.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("vote_shared_movie_title", {
    p_access_token: accessToken,
    p_participant_token: participantToken,
    p_tmdb_id: tmdbId,
    p_media_type: mediaType,
    p_liked: liked === "true",
  });
  if (error) throw new Error("Impossible d’enregistrer ce vote.");
}
