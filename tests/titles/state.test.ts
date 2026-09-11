import { describe, expect, it } from "vitest";

import { seasonRatingFields, titleRatingFields } from "@/lib/titles/state";

describe("title watched invariants", () => {
  it("preserves a title rating while it remains watched", () => {
    expect(titleRatingFields("watched")).toEqual({ rating: undefined, rating_label: undefined });
  });

  it("clears title ratings when leaving watched", () => {
    expect(titleRatingFields("to_watch")).toEqual({ rating: null, rating_label: null });
    expect(seasonRatingFields("abandoned")).toEqual({ rating_label: null });
  });
});
