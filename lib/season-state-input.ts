import type { PersonalRating, TitleStatus } from "@/types/domain";

const validStatuses: TitleStatus[] = ["to_watch", "in_progress", "watched", "abandoned", "not_interested"];
const validRatings: PersonalRating[] = ["bad", "okay", "good", "very_good", "masterpiece"];

export interface ParsedSeasonState {
  seasonNumber: number;
  status: TitleStatus;
  rating: PersonalRating | null;
}

export interface ParsedSeasonStates {
  states: ParsedSeasonState[];
  seasonNumbersToDelete: number[];
}

export function parseSeasonStates(formData: FormData, seasonNumbers: number[]): ParsedSeasonStates {
  const states: ParsedSeasonState[] = [];
  const seasonNumbersToDelete: number[] = [];

  for (const seasonNumber of seasonNumbers) {
    const statusValue = formData.get(`status-${seasonNumber}`);
    if (statusValue === null || statusValue === "") {
      seasonNumbersToDelete.push(seasonNumber);
      continue;
    }

    if (typeof statusValue !== "string" || !validStatuses.includes(statusValue as TitleStatus)) {
      throw new Error("Invalid season status input");
    }

    const ratingValue = formData.get(`ratingLabel-${seasonNumber}`);
    if (ratingValue !== null && ratingValue !== "" && (typeof ratingValue !== "string" || !validRatings.includes(ratingValue as PersonalRating))) {
      throw new Error("Invalid season rating input");
    }

    const rating = statusValue === "watched" && typeof ratingValue === "string" && ratingValue !== ""
      ? ratingValue as PersonalRating
      : null;
    states.push({ seasonNumber, status: statusValue as TitleStatus, rating });
  }

  return { states, seasonNumbersToDelete };
}
