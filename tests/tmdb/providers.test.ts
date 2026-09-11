import { describe, expect, it } from "vitest";

import { mapCanadianWatchProviders } from "@/lib/tmdb/providers";

describe("mapCanadianWatchProviders", () => {
  it("returns unique Canadian providers across availability categories", () => {
    const providers = mapCanadianWatchProviders({
      results: {
        CA: {
          flatrate: [{ provider_id: 337, provider_name: "Disney+", logo_path: "/disney.png" }],
          rent: [{ provider_id: 337, provider_name: "Disney+", logo_path: "/disney.png" }],
          buy: [{ provider_id: 350, provider_name: "Apple TV+", logo_path: null }],
        },
      },
    });

    expect(providers).toEqual([
      { id: 337, name: "Disney+", logoPath: "/disney.png", isPaid: false, audioLanguages: null },
      { id: 350, name: "Apple TV+", logoPath: null, isPaid: true, audioLanguages: null },
    ]);
  });

  it("returns an empty list when the requested region is unavailable", () => {
    expect(mapCanadianWatchProviders({ results: { US: { flatrate: [] } } })).toEqual([]);
  });
});
