import type { WatchProvider } from "@/types/domain";
import type { TmdbWatchProviderRegion, TmdbWatchProvidersResponse } from "@/types/tmdb";

const providerCollections = ["flatrate", "free", "ads", "rent", "buy"] as const satisfies Array<
  keyof TmdbWatchProviderRegion
>;

export function mapCanadianWatchProviders(
  response: TmdbWatchProvidersResponse,
  region = "CA",
): WatchProvider[] {
  const regionProviders = response.results?.[region];

  if (!regionProviders) {
    return [];
  }

  const providers = providerCollections.flatMap((collection) =>
    (regionProviders[collection] ?? []).map((provider) => ({ provider, isPaid: collection === "rent" || collection === "buy" })),
  );
  const uniqueProviders = new Map<number, WatchProvider>();

  for (const { provider, isPaid } of providers) {
    const existing = uniqueProviders.get(provider.provider_id);
    uniqueProviders.set(provider.provider_id, {
      id: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path,
      isPaid: existing ? existing.isPaid && isPaid : isPaid,
      audioLanguages: existing?.audioLanguages ?? null,
    });
  }

  return [...uniqueProviders.values()];
}
