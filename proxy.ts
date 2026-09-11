import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSupabaseSession(request);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Missing required environment variable")) {
      // Keep local catalogue browsing available until Supabase is configured.
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/explorer/:path*", "/settings/:path*", "/history/:path*", "/watchlist/:path*", "/titles/:path*"],
};
