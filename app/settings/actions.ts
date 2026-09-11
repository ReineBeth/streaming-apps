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
