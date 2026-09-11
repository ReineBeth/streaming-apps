export const audioLanguageLabels = ["FR", "EN", "subtitle only"] as const;
export type AudioLanguageLabel = (typeof audioLanguageLabels)[number];

export function getAudioLanguageLabels(audioLanguages: string[] | null | undefined): AudioLanguageLabel[] {
  if (audioLanguages == null) return [];

  const normalizedLanguages = new Set(audioLanguages.map((language) => language.trim().toLowerCase()));
  const labels: AudioLanguageLabel[] = [];
  if (normalizedLanguages.has("fr")) labels.push("FR");
  if (normalizedLanguages.has("en")) labels.push("EN");
  if (labels.length > 0) return labels;
  return ["subtitle only"];
}
