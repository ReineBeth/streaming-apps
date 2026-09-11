import { describe, expect, it } from "vitest";

import { creditsMatchPerson, mapTitleCompanies, mapTitlePeople } from "@/lib/tmdb/details";

describe("mapTitlePeople", () => {
  it("keeps principal cast and separates director and writing credits", () => {
    expect(mapTitlePeople({
      cast: [{ id: 1, name: "Acteur", character: "Héros", order: 0, profile_path: null }],
      crew: [
        { id: 2, name: "Réalisateur", job: "Director", department: "Directing", profile_path: null },
        { id: 3, name: "Scénariste", job: "Writer", department: "Writing", profile_path: null },
      ],
    })).toEqual({
      cast: [{ id: 1, name: "Acteur", character: "Héros", job: null, profilePath: null }],
      directors: [{ id: 2, name: "Réalisateur", character: null, job: "Director", profilePath: null }],
      writers: [{ id: 3, name: "Scénariste", character: null, job: "Writer", profilePath: null }],
    });
  });
});

describe("mapTitleCompanies", () => {
  it("deduplicates companies and tolerates absent data", () => {
    expect(mapTitleCompanies([
      { id: 10, name: "Studio", logo_path: null, origin_country: "CA" },
      { id: 10, name: "Studio", logo_path: null, origin_country: "CA" },
      { id: 11, name: "", logo_path: null },
    ])).toEqual([{ id: 10, name: "Studio", logoPath: null, originCountry: "CA" }]);
    expect(mapTitleCompanies(undefined)).toEqual([]);
  });
});

describe("creditsMatchPerson", () => {
  it("rejects provider discovery false positives and respects the selected role", () => {
    const credits = { cast: [{ id: 1, name: "Acteur", profile_path: null }], crew: [{ id: 2, name: "Réalisateur", job: "Director", profile_path: null }] };
    expect(creditsMatchPerson(credits, 1, "actor")).toBe(true);
    expect(creditsMatchPerson(credits, 2, "actor")).toBe(false);
    expect(creditsMatchPerson(credits, 2, "director")).toBe(true);
    expect(creditsMatchPerson(credits, 3, "actor")).toBe(false);
  });
});
