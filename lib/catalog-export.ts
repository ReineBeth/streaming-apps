import type { CatalogTitleSummary } from "@/types/domain";

const headers = [
  "tmdb_id",
  "media_type",
  "title",
  "year",
  "original_language",
  "provider_id",
  "provider_name",
  "audio_languages",
  "subtitle_languages",
];

function escapeCsv(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function catalogTitlesToCsv(titles: CatalogTitleSummary[]): string {
  const rows = titles.flatMap((title) => title.providers.map((provider) => [
    title.tmdbId,
    title.mediaType,
    title.title,
    title.year,
    title.languages[0] ?? null,
    provider.id,
    provider.name,
    provider.audioLanguages?.join("|") ?? null,
    null,
  ]));

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n") + "\r\n";
}
