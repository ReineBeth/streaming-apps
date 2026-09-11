import type { CostFilter, PersonalRating, TitleStatus, WatchProvider } from "@/types/domain";

export type ExplorerType = "all" | "movie" | "tv";
export type SortOption = "popularity" | "rating" | "newest" | "oldest";

export interface ExplorerFiltersData {
  query: string;
  type: ExplorerType;
  serviceId: number | null;
  allPlatforms: boolean;
  genreId: number | null;
  minRating: number | null;
  year: number | null;
  sort: SortOption;
  status: TitleStatus | null;
  personalRating: PersonalRating | null;
  cost: CostFilter;
  quebec: boolean;
  personId: number | null;
  personRole: "actor" | "director";
  companyId: number | null;
  page: number;
}

const MAX_QUERY_LENGTH = 80;
const MAX_PAGE = 500;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : null;
}

function parsePersonSelection(value: string): { id: number | null; role: "actor" | "director" } {
  const [idValue, roleValue] = value.split(":");
  return {
    id: positiveInteger(idValue ?? ""),
    role: roleValue === "director" ? "director" : "actor",
  };
}

export function parseExplorerFilters(
  params: Record<string, string | string[] | undefined>,
  currentYear = new Date().getFullYear(),
): ExplorerFiltersData {
  const type = firstParam(params.type);
  const serviceParam = firstParam(params.service);
  const service = positiveInteger(serviceParam);
  const genre = positiveInteger(firstParam(params.genre));
  const minRating = Number.parseFloat(firstParam(params.minRating));
  const year = positiveInteger(firstParam(params.year));
  const sort = firstParam(params.sort);
  const status = firstParam(params.status);
  const personalRating = firstParam(params.personalRating);
  const cost = firstParam(params.cost);
  const personSelection = parsePersonSelection(firstParam(params.personId));
  const page = positiveInteger(firstParam(params.page));

  return {
    query: firstParam(params.q).trim().slice(0, MAX_QUERY_LENGTH),
    type: type === "movie" || type === "tv" ? type : "all",
    serviceId: service,
    allPlatforms: serviceParam === "all",
    genreId: genre,
    minRating: Number.isFinite(minRating) && minRating >= 0 && minRating <= 10 ? minRating : null,
    year: year !== null && year >= 1900 && year <= currentYear ? year : null,
    sort: sort === "rating" || sort === "newest" || sort === "oldest" ? sort : "popularity",
    status: status === "to_watch" || status === "in_progress" || status === "watched" || status === "abandoned" || status === "not_interested" ? status : null,
    personalRating: personalRating === "bad" || personalRating === "okay" || personalRating === "good" || personalRating === "very_good" || personalRating === "masterpiece" ? personalRating : null,
    cost: cost === "paid" || cost === "all" ? cost : "free",
    quebec: firstParam(params.quebec) === "true",
    personId: personSelection.id,
    personRole: personSelection.id ? personSelection.role : "actor",
    companyId: positiveInteger(firstParam(params.companyId)),
    page: page === null ? 1 : Math.min(page, MAX_PAGE),
  };
}

export function matchesCostFilter(providers: WatchProvider[], cost: CostFilter): boolean {
  if (cost === "all") return providers.length > 0;
  return providers.some((provider) => cost === "paid" ? provider.isPaid : !provider.isPaid);
}

export function firstExplorerParam(value: string | string[] | undefined): string {
  return firstParam(value);
}

export function resolveExactPerson(
  query: string,
  people: Array<{ id: number; name: string; known_for_department?: string }>,
): { id: number; role: "actor" | "director" } | null {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-CA");
  const match = people.find((person) => person.name.trim().toLocaleLowerCase("fr-CA") === normalizedQuery);
  if (!match) return null;
  return { id: match.id, role: match.known_for_department === "Directing" ? "director" : "actor" };
}
