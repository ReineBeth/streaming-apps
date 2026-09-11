export const MAX_EXPORT_TITLES = 500;
export const TMDB_PAGE_SIZE = 20;

export function getExportPageNumbers(totalPages: number): number[] {
  const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : 1;
  const pageLimit = Math.ceil(MAX_EXPORT_TITLES / TMDB_PAGE_SIZE);
  return Array.from({ length: Math.min(safeTotalPages, pageLimit) }, (_, index) => index + 1);
}
