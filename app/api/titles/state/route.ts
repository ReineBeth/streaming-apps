import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { titleRatingFields } from "@/lib/titles/state";
import type { Database } from "@/lib/supabase/database.types";
import type { MediaType, PersonalRating, TitleStatus } from "@/types/domain";

const validStatuses: TitleStatus[] = ["to_watch", "in_progress", "watched", "abandoned", "not_interested"];
const validRatings: PersonalRating[] = ["bad", "okay", "good", "very_good", "masterpiece"];

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; tmdbId?: number; mediaType?: MediaType; status?: TitleStatus; ratingLabel?: PersonalRating };
    const tmdbId = typeof body.tmdbId === "number" && Number.isInteger(body.tmdbId) && body.tmdbId > 0 ? body.tmdbId : null;
    const mediaType = body.mediaType === "movie" || body.mediaType === "tv" ? body.mediaType : null;
    if (tmdbId === null || !mediaType) return NextResponse.json({ error: "Invalid title input" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    if (body.action === "status" && body.status && validStatuses.includes(body.status)) {
      const titleState: Database["public"]["Tables"]["user_titles"]["Insert"] = { user_id: user.id, tmdb_id: tmdbId, media_type: mediaType, status: body.status, ...titleRatingFields(body.status) };
      const { error } = await supabase.from("user_titles").upsert(titleState, { onConflict: "user_id,tmdb_id,media_type" });
      if (error) return NextResponse.json({ error: "Unable to update title status" }, { status: 500 });
      revalidatePath(`/titles/${mediaType}/${tmdbId}`);
      revalidatePath("/watchlist");
      revalidatePath("/history");
      return NextResponse.json({ status: body.status });
    }

    if (body.action === "rating" && body.ratingLabel && validRatings.includes(body.ratingLabel)) {
      const { data: existingTitle, error: readError } = await supabase.from("user_titles").select("status").eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType).maybeSingle();
      if (readError || existingTitle?.status !== "watched") return NextResponse.json({ error: "A rating requires a watched title" }, { status: 400 });
      const { error } = await supabase.from("user_titles").update({ rating: null, rating_label: body.ratingLabel }).eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType);
      if (error) return NextResponse.json({ error: "Unable to update title rating" }, { status: 500 });
      revalidatePath(`/titles/${mediaType}/${tmdbId}`);
      revalidatePath("/history");
      return NextResponse.json({ rating: body.ratingLabel });
    }

    return NextResponse.json({ error: "Invalid title state input" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to save title state" }, { status: 500 });
  }
}
