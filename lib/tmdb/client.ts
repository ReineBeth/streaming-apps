import "server-only";

import { getTmdbApiKey } from "@/lib/env";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export class TmdbApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TmdbApiError";
  }
}

export async function tmdbRequest<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${TMDB_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("api_key", getTmdbApiKey());

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });
  } catch {
    throw new TmdbApiError("TMDB is unavailable", 0);
  }

  if (!response.ok) {
    throw new TmdbApiError(`TMDB request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}
