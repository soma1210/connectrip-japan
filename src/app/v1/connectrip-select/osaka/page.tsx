import { redirect } from "next/navigation";
import { routeHref } from "@/website-v1/routes";

/**
 * Moved (2026-11-14): the Osaka map is now part of Explore Kansai,
 * `/explore/map/osaka`. This preview URL forwards there, keeping `?spot=`.
 * It was never public, so no production redirect exists (public mode answers
 * 404 for it, as before).
 */
type Props = { searchParams: Promise<{ spot?: string }> };

export default async function V1ConnectripSelectOsakaMoved({ searchParams }: Props) {
  const { spot } = await searchParams;
  redirect(spot ? `${routeHref("connectripSelect")}?spot=${encodeURIComponent(spot)}` : routeHref("connectripSelect"));
}
