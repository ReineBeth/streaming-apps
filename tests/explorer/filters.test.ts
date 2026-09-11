import { describe, expect, it } from "vitest";

import { matchesCostFilter, parseExplorerFilters, resolveExactPerson } from "@/lib/explorer/filters";
import type { WatchProvider } from "@/types/domain";

const provider = (isPaid: boolean): WatchProvider => ({ id: isPaid ? 1 : 2, name: "Service", logoPath: null, isPaid, audioLanguages: null });

describe("parseExplorerFilters", () => {
  it("bounds the query and rejects malformed numeric filters", () => {
    const filters = parseExplorerFilters({
      q: "  a".repeat(100),
      page: "9999abc",
      service: "12.5",
    genre: "-3",
    year: "2030",
    minRating: "11",
    personId: "123:director",
    companyId: "456",
    }, 2026);

    expect(filters.query).toHaveLength(80);
    expect(filters.page).toBe(1);
    expect(filters.serviceId).toBeNull();
    expect(filters.allPlatforms).toBe(false);
    expect(filters.genreId).toBeNull();
    expect(filters.year).toBeNull();
    expect(filters.minRating).toBeNull();
    expect(filters.personId).toBe(123);
    expect(filters.personRole).toBe("director");
    expect(filters.companyId).toBe(456);
  });

  it("accepts supported filters and caps valid pages at TMDB's limit", () => {
    expect(parseExplorerFilters({ type: "tv", service: "2303", genre: "18", year: "2024", minRating: "7", page: "999", quebec: "true", status: "watched", personalRating: "good", sort: "newest" }, 2026)).toEqual({
      query: "",
      type: "tv",
      serviceId: 2303,
      allPlatforms: false,
      genreId: 18,
      minRating: 7,
      year: 2024,
      sort: "newest",
      status: "watched",
      personalRating: "good",
      cost: "free",
      quebec: true,
      personId: null,
      personRole: "actor",
      companyId: null,
      page: 500,
    });
  });

  it("accepts the free, paid and all availability filters", () => {
    expect(parseExplorerFilters({ cost: "paid" }).cost).toBe("paid");
    expect(parseExplorerFilters({ cost: "all" }).cost).toBe("all");
    expect(parseExplorerFilters({ cost: "invalid" }).cost).toBe("free");
  });

  it("keeps all platforms opt-in while defaulting to active services", () => {
    expect(parseExplorerFilters({}).allPlatforms).toBe(false);
    expect(parseExplorerFilters({ service: "active" }).allPlatforms).toBe(false);
    expect(parseExplorerFilters({ service: "all" }).allPlatforms).toBe(true);
    expect(parseExplorerFilters({ service: "all" }).serviceId).toBeNull();
  });

  it("matches provider availability against the selected cost", () => {
    expect(matchesCostFilter([provider(false)], "free")).toBe(true);
    expect(matchesCostFilter([provider(true)], "free")).toBe(false);
    expect(matchesCostFilter([provider(true)], "paid")).toBe(true);
    expect(matchesCostFilter([provider(false)], "paid")).toBe(false);
    expect(matchesCostFilter([provider(false), provider(true)], "all")).toBe(true);
  });
});

describe("resolveExactPerson", () => {
  it("resolves an exact actor name without requiring a second selection", () => {
    expect(resolveExactPerson(" Pedro Pascal ", [{ id: 1, name: "Pedro Pascal", known_for_department: "Acting" }])).toEqual({ id: 1, role: "actor" });
  });

  it("resolves directors and leaves partial names for explicit selection", () => {
    expect(resolveExactPerson("Denis Villeneuve", [{ id: 2, name: "Denis Villeneuve", known_for_department: "Directing" }])).toEqual({ id: 2, role: "director" });
    expect(resolveExactPerson("Pedro", [{ id: 1, name: "Pedro Pascal" }])).toBeNull();
  });
});
