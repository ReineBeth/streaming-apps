import { describe, expect, it } from "vitest";

import { parseSeasonStates } from "@/lib/season-state-input";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseSeasonStates", () => {
  it("marks an empty status for deletion", () => {
    const result = parseSeasonStates(
      formData({ "status-1": "", "ratingLabel-1": "good", "status-2": "watched", "ratingLabel-2": "masterpiece" }),
      [1, 2],
    );

    expect(result.seasonNumbersToDelete).toEqual([1]);
    expect(result.states).toEqual([{ seasonNumber: 2, status: "watched", rating: "masterpiece" }]);
  });

  it("clears a rating when a season is not watched", () => {
    const result = parseSeasonStates(
      formData({ "status-1": "in_progress", "ratingLabel-1": "very_good" }),
      [1],
    );

    expect(result.states).toEqual([{ seasonNumber: 1, status: "in_progress", rating: null }]);
  });

  it("rejects non-empty invalid status and rating values", () => {
    expect(() => parseSeasonStates(formData({ "status-1": "unknown" }), [1])).toThrow("Invalid season status input");
    expect(() => parseSeasonStates(formData({ "status-1": "watched", "ratingLabel-1": "unknown" }), [1])).toThrow("Invalid season rating input");
  });
});
