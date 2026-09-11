"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseSeasonStates } from "@/lib/season-state-input";
import { seasonRatingFields, titleRatingFields } from "@/lib/titles/state";
import type { Database } from "@/lib/supabase/database.types";
import type { MediaType, PersonalRating, TitleStatus } from "@/types/domain";

const validStatuses: TitleStatus[] = ["to_watch", "in_progress", "watched", "abandoned", "not_interested"];
const validRatings: PersonalRating[] = ["bad", "okay", "good", "very_good", "masterpiece"];

export async function updateTitleStatus(formData: FormData) {
  const tmdbIdValue = formData.get("tmdbId");
  const mediaTypeValue = formData.get("mediaType");
  const statusValue = formData.get("status");

  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  const mediaType = mediaTypeValue === "movie" || mediaTypeValue === "tv" ? mediaTypeValue as MediaType : null;
  const status = typeof statusValue === "string" && validStatuses.includes(statusValue as TitleStatus) ? statusValue as TitleStatus : null;

  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !mediaType || !status) {
    throw new Error("Invalid title status input");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=%2Ftitles%2F${mediaType}%2F${tmdbId}`);

  const titleState: Database["public"]["Tables"]["user_titles"]["Insert"] = {
    user_id: user.id,
    tmdb_id: tmdbId,
    media_type: mediaType,
    status,
    ...titleRatingFields(status),
  };
  const { error } = await supabase.from("user_titles").upsert(
    titleState,
    { onConflict: "user_id,tmdb_id,media_type" },
  );
  if (error) throw new Error("Unable to update title status");

  revalidatePath(`/titles/${mediaType}/${tmdbId}`);
  revalidatePath("/watchlist");
  revalidatePath("/history");
}

export async function updateTitleRating(formData: FormData) {
  const tmdbIdValue = formData.get("tmdbId");
  const mediaTypeValue = formData.get("mediaType");
  const ratingValue = formData.get("ratingLabel");
  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  const mediaType = mediaTypeValue === "movie" || mediaTypeValue === "tv" ? mediaTypeValue as MediaType : null;
  const rating = typeof ratingValue === "string" && validRatings.includes(ratingValue as PersonalRating) ? ratingValue as PersonalRating : null;

  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !mediaType || !rating) throw new Error("Invalid title rating input");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=%2Ftitles%2F${mediaType}%2F${tmdbId}`);

  const { data: existingTitle, error: readError } = await supabase.from("user_titles").select("status").eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType).maybeSingle();
  if (readError || existingTitle?.status !== "watched") throw new Error("A rating requires a watched title");

  const { error } = await supabase.from("user_titles").update({ rating: null, rating_label: rating }).eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType);
  if (error) throw new Error("Unable to update title rating");

  revalidatePath(`/titles/${mediaType}/${tmdbId}`);
  revalidatePath("/history");
  revalidatePath("/explorer");
}

function readSeasonInput(formData: FormData) {
  const tmdbIdValue = formData.get("tmdbId");
  const seasonValue = formData.get("seasonNumber");
  const statusValue = formData.get("status");
  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  const seasonNumber = typeof seasonValue === "string" ? Number.parseInt(seasonValue, 10) : NaN;
  const status = typeof statusValue === "string" && validStatuses.includes(statusValue as TitleStatus) ? statusValue as TitleStatus : null;
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber <= 0 || !status) throw new Error("Invalid season input");
  return { tmdbId, seasonNumber, status };
}

export async function updateSeasonStatus(formData: FormData) {
  const { tmdbId, seasonNumber, status } = readSeasonInput(formData);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=%2Ftitles%2Ftv%2F${tmdbId}`);
  const seasonState: Database["public"]["Tables"]["user_seasons"]["Insert"] = { user_id: user.id, tmdb_id: tmdbId, season_number: seasonNumber, status, ...seasonRatingFields(status) };
  const { error } = await supabase.from("user_seasons").upsert(seasonState, { onConflict: "user_id,tmdb_id,season_number" });
  if (error) throw new Error("Unable to update season status");
  revalidatePath(`/titles/tv/${tmdbId}`);
  revalidatePath("/explorer");
  revalidatePath("/history");
}

export async function updateSeasonRating(formData: FormData) {
  const tmdbIdValue = formData.get("tmdbId");
  const seasonValue = formData.get("seasonNumber");
  const ratingValue = formData.get("ratingLabel");
  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  const seasonNumber = typeof seasonValue === "string" ? Number.parseInt(seasonValue, 10) : NaN;
  const rating = typeof ratingValue === "string" && validRatings.includes(ratingValue as PersonalRating) ? ratingValue as PersonalRating : null;
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber <= 0 || !rating) throw new Error("Invalid season rating input");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=%2Ftitles%2Ftv%2F${tmdbId}`);
  const { data: season, error: readError } = await supabase.from("user_seasons").select("status").eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("season_number", seasonNumber).maybeSingle();
  if (readError || season?.status !== "watched") throw new Error("A season rating requires a watched season");
  const { error } = await supabase.from("user_seasons").update({ rating_label: rating }).eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("season_number", seasonNumber);
  if (error) throw new Error("Unable to update season rating");
  revalidatePath(`/titles/tv/${tmdbId}`);
  revalidatePath("/explorer");
  revalidatePath("/history");
}

export async function updateAllSeasonStates(formData: FormData) {
  const tmdbIdValue = formData.get("tmdbId");
  const seasonNumbersValue = formData.get("seasonNumbers");
  const tmdbId = typeof tmdbIdValue === "string" ? Number.parseInt(tmdbIdValue, 10) : NaN;
  const seasonNumbers = typeof seasonNumbersValue === "string" ? seasonNumbersValue.split(",").map((value) => Number.parseInt(value, 10)).filter((value) => Number.isInteger(value) && value > 0) : [];
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || seasonNumbers.length === 0) throw new Error("Invalid season states input");

  const { states, seasonNumbersToDelete } = parseSeasonStates(formData, seasonNumbers);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=%2Ftitles%2Ftv%2F${tmdbId}`);
  if (seasonNumbersToDelete.length > 0) {
    const { error } = await supabase
      .from("user_seasons")
      .delete()
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .in("season_number", seasonNumbersToDelete);
    if (error) throw new Error("Unable to remove season states");
  }
  if (states.length > 0) {
    const { error } = await supabase.from("user_seasons").upsert(states.map(({ seasonNumber, status, rating }) => ({ user_id: user.id, tmdb_id: tmdbId, season_number: seasonNumber, status, rating_label: rating })), { onConflict: "user_id,tmdb_id,season_number" });
    if (error) throw new Error("Unable to update season states");
  }
  revalidatePath(`/titles/tv/${tmdbId}`);
  revalidatePath("/explorer");
  revalidatePath("/history");
}
