import type { ImageAsset } from "./media";
import type { PageViewModel } from "./pages";
import type { Tbd } from "./status";

/**
 * Connectrip Select: a map-first guide to places Connectrip picks (Osaka
 * first), shown on an illustrated, geographically accurate map of Osaka
 * (v0.2). Pins + names by default, a compact popup (photo, name, area) only
 * after a click.
 *
 * Future (not built): spot pages, View Guide / Add to My Private Day / View
 * Experience actions, shortDescription, localTip, bestFor, openingHours,
 * price, officialUrl, lastVerifiedAt, relatedArticleId, relatedExperienceId,
 * privateGuideEligible. Add them as optional fields.
 */
export type SelectAreaKey =
  | "kita_umeda"
  | "central_osaka"
  | "osaka_castle"
  | "minami_namba"
  | "tennoji_shinsekai"
  | "osaka_bay"
  | "suita_expo"
  | "minoh";

export type SelectCategoryKey = "food" | "culture" | "nature" | "shopping" | "family";

/** Where a coordinate comes from. Pins must sit on the real place: never estimated. */
export type GeoSource = {
  kind: "openstreetmap" | "wikidata";
  /** e.g. `way/34619038` or `Q321242`. */
  ref: string;
  checkedAt: string;
  /** Second source used to cross-check, with the distance between them. */
  crossCheck?: { kind: "openstreetmap" | "wikidata"; ref: string; distanceMeters: number };
  note?: string;
};

export type SelectSpot = {
  id: string;
  slug: string;
  name: string;
  /** Local name, shown under the English name in the popup. */
  nameJa?: string;
  area: SelectAreaKey;
  categories: SelectCategoryKey[];
  latitude: number;
  longitude: number;
  geoSource: GeoSource;
  mainImage: Tbd<ImageAsset>;
};

export type SelectMapContent = {
  /** Small label above the heading, e.g. "CONNECTRIP SELECT". */
  eyebrow: Tbd<string>;
  /** Page heading, e.g. "Explore Osaka". */
  heading: Tbd<string>;
  areaName: Tbd<string>;
  description: Tbd<string>;
  /** Short line under the map. */
  note?: Tbd<string>;
  areas: Record<SelectAreaKey, Tbd<string>>;
  categories: { key: SelectCategoryKey; label: Tbd<string> }[];
  spots: SelectSpot[];
  /** The illustration is derived from OpenStreetMap data (ODbL): attribution required. */
  attribution: { text: string; url: string };
};

export type ConnectripSelectViewModel = PageViewModel<"connectripSelect", SelectMapContent>;
