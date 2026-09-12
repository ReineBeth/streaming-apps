"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleStreamingService(formData: FormData) {
  const serviceId = formData.get("serviceId");
  const activeValue = formData.get("active");

  if (typeof serviceId !== "string" || !UUID_PATTERN.test(serviceId) || typeof activeValue !== "string") {
    throw new Error("Invalid streaming service input");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const { error } = await supabase.from("user_streaming_services").upsert(
    {
      user_id: user.id,
      streaming_service_id: serviceId,
      active: activeValue === "true",
    },
    { onConflict: "user_id,streaming_service_id" },
  );

  if (error) {
    throw new Error("Unable to update streaming service");
  }

  revalidatePath("/settings");
  revalidatePath("/explorer");
}

export async function updateDisplayName(formData: FormData) {
  const value = formData.get("displayName");

  if (typeof value !== "string") {
    throw new Error("Invalid display name input");
  }

  const displayName = value.trim();

  if (displayName.length < 1 || displayName.length > 80) {
    throw new Error("Display name must contain between 1 and 80 characters");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    throw new Error("Unable to update display name");
  }

  revalidatePath("/settings");
}

export async function toggleFriendExclusion(formData: FormData) {
  const friendId = formData.get("friendId");
  const excludedValue = formData.get("excluded");

  if (typeof friendId !== "string" || !UUID_PATTERN.test(friendId) || typeof excludedValue !== "string") {
    throw new Error("Invalid friend input");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const excluded = excludedValue === "true";
  const result = excluded
    ? await supabase.from("friend_exclusions").upsert({ user_id: user.id, excluded_user_id: friendId })
    : await supabase.from("friend_exclusions").delete().eq("user_id", user.id).eq("excluded_user_id", friendId);

  if (result.error) {
    throw new Error("Unable to update friend preferences");
  }

  revalidatePath("/settings");
  revalidatePath("/explorer");
  revalidatePath("/roulette");
}
