import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components", "lib"];
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) return getSourceFiles(filePath);
    return sourceExtensions.has(path.extname(entry.name)) ? [filePath] : [];
  });
}

// Detects UTF-8 text that was decoded as Windows-1252/Latin-1, plus replacement characters.
const corruptedEncodingPattern = new RegExp(
  "(?:\\u00c3[\\u0080-\\u00bf]|\\u00c2[\\u0080-\\u00bf]|\\u00e2[\\u0080-\\u00bf]{2}|\\u00f0[\\u0080-\\u00bf]{3}|\\ufffd)",
  "u",
);

describe("source encoding", () => {
  it("does not contain corrupted UTF-8 sequences in UI sources", () => {
    const files = sourceRoots.flatMap((root) => getSourceFiles(path.resolve(root)));
    const corruptedFiles = files.flatMap((filePath) => {
      const content = readFileSync(filePath, "utf8");
      const match = corruptedEncodingPattern.exec(content);

      return match
        ? [{ filePath, sequence: match[0], line: content.slice(0, match.index).split("\n").length }]
        : [];
    });

    expect(corruptedFiles).toEqual([]);
  });
});
