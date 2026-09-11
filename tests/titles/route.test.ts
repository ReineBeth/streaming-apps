import { describe, expect, it } from "vitest";

import { parseTitleRoute } from "@/lib/titles/route";

describe("parseTitleRoute", () => {
  it("accepts supported media types and strict positive numeric ids", () => {
    expect(parseTitleRoute("movie", "123")).toEqual({ mediaType: "movie", tmdbId: 123 });
    expect(parseTitleRoute("tv", "456")).toEqual({ mediaType: "tv", tmdbId: 456 });
  });

  it("rejects malformed, unsupported, zero and unsafe ids", () => {
    expect(parseTitleRoute("person", "123")).toBeNull();
    expect(parseTitleRoute("movie", "123abc")).toBeNull();
    expect(parseTitleRoute("movie", "1.5")).toBeNull();
    expect(parseTitleRoute("movie", "0")).toBeNull();
    expect(parseTitleRoute("movie", "9007199254740992")).toBeNull();
  });
});
