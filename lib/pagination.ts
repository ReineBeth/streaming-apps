export type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

export function shouldShowPagination(current: number, total: number, itemCount?: number, pageSize?: number): boolean {
  if (total <= 1) return false;
  if (current > 1) return true;
  return itemCount === undefined || pageSize === undefined || itemCount >= pageSize;
}

export function getPaginationItems(total: number, current: number, siblings = 1, boundaries = 1): PaginationItem[] {
  const safeTotal = Math.max(1, Math.floor(total));
  const safeCurrent = Math.min(Math.max(1, Math.floor(current)), safeTotal);
  const minimumItems = siblings * 2 + boundaries * 2 + 3;
  if (safeTotal <= minimumItems) return Array.from({ length: safeTotal }, (_, index) => index + 1);

  const leftSibling = Math.max(safeCurrent - siblings, boundaries + 1);
  const rightSibling = Math.min(safeCurrent + siblings, safeTotal - boundaries);
  const showLeftEllipsis = leftSibling > boundaries + 1;
  const showRightEllipsis = rightSibling < safeTotal - boundaries;
  const items: PaginationItem[] = [];
  for (let page = 1; page <= boundaries; page += 1) items.push(page);
  if (showLeftEllipsis) items.push("ellipsis-left");
  else for (let page = boundaries + 1; page < leftSibling; page += 1) items.push(page);
  for (let page = leftSibling; page <= rightSibling; page += 1) items.push(page);
  if (showRightEllipsis) items.push("ellipsis-right");
  else for (let page = rightSibling + 1; page < safeTotal - boundaries + 1; page += 1) items.push(page);
  for (let page = safeTotal - boundaries + 1; page <= safeTotal; page += 1) items.push(page);
  return items;
}
