import { describe, expect, it } from "vitest";

import { getPaginationItems, shouldShowPagination } from "@/lib/pagination";

describe("getPaginationItems", () => {
  it("shows every page when the range is short", () => {
    expect(getPaginationItems(5, 3)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps first, last and nearby pages with ellipses", () => {
    expect(getPaginationItems(20, 10, 1, 2)).toEqual([1, 2, "ellipsis-left", 9, 10, 11, "ellipsis-right", 19, 20]);
    expect(getPaginationItems(20, 2, 1, 2)).toEqual([1, 2, 3, "ellipsis-right", 19, 20]);
  });
});

describe("shouldShowPagination", () => {
  it("hides pagination when the first page is partial", () => {
    expect(shouldShowPagination(1, 4, 12, 36)).toBe(false);
  });

  it("keeps pagination on a full first page and on later pages", () => {
    expect(shouldShowPagination(1, 4, 36, 36)).toBe(true);
    expect(shouldShowPagination(2, 4, 3, 36)).toBe(true);
  });
});
