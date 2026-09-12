import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { PersonalRating } from "@/types/domain";

export const FRIEND_RECOMMENDATION_RATINGS: PersonalRating[] = ["good", "very_good", "masterpiece"];

export async function getFriendRecommendedTitleKeys(
  supabase: SupabaseClient<Database>,
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("get_friend_recommended_titles");

  if (error) throw new Error("Unable to load friend recommendations");

  return new Set((data ?? []).map((title) => `${title.media_type}:${title.tmdb_id}`));
}
