import { routeHref } from "../../routes";
import type { ExploreArea, UpdateArea } from "./types";

/**
 * Area copy for the area pages, filters and cards. `mapHref`: the area's
 * Connectrip Japan Select map, when one exists (Osaka only for now).
 * Intros describe the area in general terms only (no facts that need a source).
 */
export const AREA_INFO: Record<ExploreArea, { name: string; intro: string; mapHref?: string }> = {
  osaka: {
    name: "Osaka",
    intro: "Street food, shopping streets, historic shrines and temples, and the neon of Dotonbori: our guides to Osaka, written by the local team behind Connectrip Japan.",
    mapHref: routeHref("connectripSelect"),
  },
  kyoto: { name: "Kyoto", intro: "Temples, gardens and old streets: our guides to Kyoto." },
  nara: { name: "Nara", intro: "Ancient temples, shrines and the deer park: our guides to Nara." },
  kobe: { name: "Kobe", intro: "A port city between the mountains and the sea: our guides to Kobe." },
};

export function areaName(area: UpdateArea): string {
  return area === "kansai" ? "Kansai" : AREA_INFO[area].name;
}
