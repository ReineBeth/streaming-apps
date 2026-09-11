import { getTitleProviderAudioLanguagesForTitles, getActiveTmdbProviderIds } from "@/lib/streaming-services";
import { mapWithConcurrency } from "@/lib/explorer/enrichment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExportPageNumbers, MAX_EXPORT_TITLES } from "@/lib/catalog-export-limits";
import { getWatchProviders, discoverMovies } from "@/lib/tmdb/catalog";
import { catalogTitlesToCsv } from "@/lib/catalog-export";
import type { CatalogTitleSummary } from "@/types/domain";
import type { TmdbMovie } from "@/types/tmdb";

function toSummary(title: TmdbMovie, providers: CatalogTitleSummary["providers"]): CatalogTitleSummary {
  return {
    tmdbId: title.id,
    mediaType: "movie",
    title: title.title,
    overview: title.overview,
    year: Number.parseInt(title.release_date.slice(0, 4), 10) || null,
    posterPath: title.poster_path,
    tmdbRating: title.vote_average || null,
    languages: title.original_language ? [title.original_language] : [],
    providers,
    status: null,
    personalRating: null,
    seasonRatings: [],
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    const providerIds = await getActiveTmdbProviderIds();
    if (providerIds.length === 0) return csvResponse("﻿" + catalogTitlesToCsv([]));

    const firstPage = await discoverMovies(providerIds, 1);
    const pageNumbers = getExportPageNumbers(firstPage.total_pages);
    const pages = await mapWithConcurrency(pageNumbers.slice(1), 4, (page) => discoverMovies(providerIds, page));
    const titlesById = new Map<number, TmdbMovie>();
    for (const title of [firstPage, ...pages].flatMap((page) => page.results).slice(0, MAX_EXPORT_TITLES)) titlesById.set(title.id, title);
    const titles = [...titlesById.values()];
    const audioLanguages = await getTitleProviderAudioLanguagesForTitles(titles.map((title) => ({ tmdbId: title.id, mediaType: "movie" as const })));

    const summaries = await mapWithConcurrency(titles, 8, async (title) => {
      try {
        const providers = await getWatchProviders(title.id, "movie");
        const titleAudioLanguages = audioLanguages.get(`movie:${title.id}`) ?? {};
        const availableProviders = providers
          .filter((provider) => providerIds.includes(provider.id))
          .map((provider) => ({ ...provider, audioLanguages: titleAudioLanguages[provider.id] ?? null }));
        return toSummary(title, availableProviders);
      } catch (error) {
        console.error("Catalog export title error", error instanceof Error ? error.message : "Unknown error");
        return null;
      }
    });

    return csvResponse(`\ufeff${catalogTitlesToCsv(summaries.flatMap((title) => title && title.providers.length > 0 ? [title] : []))}`);
  } catch (error) {
    console.error("Catalog export error", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Unable to export the catalogue" }, { status: 502 });
  }
}

function csvResponse(csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="streaming-apps-films.csv"',
      "Cache-Control": "no-store",
    },
  });
}
