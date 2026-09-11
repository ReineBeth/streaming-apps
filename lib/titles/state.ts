import type { PersonalRating, TitleStatus } from "@/types/domain";

export function titleRatingFields(status: TitleStatus): { rating: number | null | undefined; rating_label: PersonalRating | null | undefined } {
  return status === "watched" ? { rating: undefined, rating_label: undefined } : { rating: null, rating_label: null };
}

export function seasonRatingFields(status: TitleStatus): { rating_label: PersonalRating | null | undefined } {
  return { rating_label: status === "watched" ? undefined : null };
}
