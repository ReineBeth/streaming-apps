import type { TitleCompany, TitleCredit } from "@/types/domain";
import type { TmdbCredits, TmdbProductionCompany } from "@/types/tmdb";

const MAX_CAST = 12;
const MAX_CREW_PER_ROLE = 6;

export interface TitleDetailsPeople {
  cast: TitleCredit[];
  directors: TitleCredit[];
  writers: TitleCredit[];
}

function mapCredit(credit: { id: number; name: string; character?: string; job?: string; profile_path: string | null }): TitleCredit {
  return {
    id: credit.id,
    name: credit.name,
    character: credit.character ?? null,
    job: credit.job ?? null,
    profilePath: credit.profile_path,
  };
}

export function mapTitlePeople(credits: TmdbCredits | undefined): TitleDetailsPeople {
  const cast = [...(credits?.cast ?? [])].sort((first, second) => (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER)).slice(0, MAX_CAST).map(mapCredit);
  const directors = (credits?.crew ?? []).filter((credit) => credit.job === "Director").slice(0, MAX_CREW_PER_ROLE).map(mapCredit);
  const writers = (credits?.crew ?? []).filter((credit) => credit.department === "Writing" || ["Writer", "Screenplay", "Story"].includes(credit.job ?? "")).slice(0, MAX_CREW_PER_ROLE).map(mapCredit);
  return { cast, directors, writers };
}

export function creditsMatchPerson(credits: TmdbCredits | undefined, personId: number, role: "actor" | "director"): boolean {
  if (role === "director") return (credits?.crew ?? []).some((credit) => credit.id === personId && credit.job === "Director");
  return (credits?.cast ?? []).some((credit) => credit.id === personId);
}

export function mapTitleCompanies(companies: TmdbProductionCompany[] | undefined): TitleCompany[] {
  return Array.from(new Map((companies ?? []).filter((company) => company.name.trim()).map((company) => [company.id, company])).values()).slice(0, 12).map((company) => ({
    id: company.id,
    name: company.name,
    logoPath: company.logo_path,
    originCountry: company.origin_country ?? null,
  }));
}
