import { describe, expect, it } from "vitest";

import type { CatalogTitleSummary } from "@/types/domain";
import { getTitleKey, pickRandomTitle } from "@/lib/roulette/selection";

function title(tmdbId: number, mediaType: CatalogTitleSummary["mediaType"], name: string): CatalogTitleSummary {
  return {
    tmdbId,
    mediaType,
    title: name,
    overview: "",
    year: null,
    posterPath: null,
    tmdbRating: null,
    languages: [],
    providers: [],
    status: null,
    personalRating: null,
    seasonRatings: [],
  };
}

describe("roulette selection", () => {
  it("creates a key that distinguishes media types", () => {
    expect(getTitleKey(title(42, "movie", "Film"))).toBe("movie:42");
    expect(getTitleKey(title(42, "tv", "Série"))).toBe("tv:42");
  });

  it("selects an available title using the injected random source", () => {
    const candidates = [title(1, "movie", "Premier"), title(2, "tv", "Deuxième")];

    expect(pickRandomTitle(candidates, new Set(), () => 0.75)).toBe(candidates[1]);
  });

  it("excludes every title already drawn", () => {
    const candidates = [title(1, "movie", "Déjà tiré"), title(2, "movie", "Disponible")];

    expect(pickRandomTitle(candidates, new Set(["movie:1"]), () => 0)).toBe(candidates[1]);
  });

  it("returns null when the session has exhausted its candidates", () => {
    const candidates = [title(1, "movie", "Déjà tiré")];

    expect(pickRandomTitle(candidates, new Set(["movie:1"]))).toBeNull();
  });
});
