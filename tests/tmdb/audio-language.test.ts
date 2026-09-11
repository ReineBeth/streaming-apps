import { describe, expect, it } from "vitest";

import { getAudioLanguageLabels } from "@/lib/streaming-audio";

describe("getAudioLanguageLabels", () => {
  it("returns the French and English labels offered by a provider", () => {
    expect(getAudioLanguageLabels(["fr", "en", "ja"])).toEqual(["FR", "EN"]);
  });

  it("returns subtitle only when audio is known and neither French nor English is offered", () => {
    expect(getAudioLanguageLabels(["ja"])).toEqual(["subtitle only"]);
  });

  it("returns no label when audio availability is unknown", () => {
    expect(getAudioLanguageLabels(null)).toEqual([]);
  });
});
