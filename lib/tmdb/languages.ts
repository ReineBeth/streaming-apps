const languageLabels: Record<string, string> = {
  ar: "Arabe",
  de: "Allemand",
  en: "Anglais",
  es: "Espagnol",
  fr: "Français",
  it: "Italien",
  ja: "Japonais",
  ko: "Coréen",
  pt: "Portugais",
  zh: "Chinois",
};

export function getLanguageLabel(code: string): string {
  return languageLabels[code.toLowerCase()] ?? code.toUpperCase();
}
