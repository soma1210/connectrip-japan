import { V1_PREVIEW } from "../../config";
import { exploreHref, exploreSelectHref, exploreUpdatesHref } from "../../routes";
import { displayPhoto, spotById } from "../spots";
import { AREA_INFO } from "./areas";
import { formatIsoDate } from "../../components/format";
import type { JournalPage } from "../journal";
import { EXPLORE_COPY, STATUS_LABEL, UPDATE_CATEGORIES, areaName, articleHref, articleSpotIds, getLatestArticles, getSelectArticles, getUpdateLists, type EditorialStatus } from "./index";

/** Articles shown on Home (the rest are one click away on the Explore hub). */
const HOME_ITEMS = 4;

/**
 * Home "Explore Kansai" section data, in the shape the existing Journal
 * section renders (components/journal/KansaiTravelJournal.tsx), so its
 * approved design, motion and responsive layout stay as they are.
 */
export function getExploreHomeSection() {
  const latest = getLatestArticles().slice(0, HOME_ITEMS);
  const page: JournalPage = {
    page: 1,
    totalPages: 1,
    pageHrefs: [exploreHref()],
    items: latest.map((a) => ({
      id: a.slug,
      href: articleHref(a),
      title: a.title,
      summary: a.summary,
      category: a.kind === "select" ? EXPLORE_COPY.select.label : a.category,
      area: areaName(a.area),
      published: a.publishedAt ? formatIsoDate(a.publishedAt) : undefined,
      flags: V1_PREVIEW && a.status !== "published" ? [STATUS_LABEL[a.status].toUpperCase()] : [],
    })),
  };
  return {
    page,
    copy: {
      brand: "CONNECTRIP JAPAN",
      title: EXPLORE_COPY.title,
      subtitle: `${EXPLORE_COPY.select.label} & ${EXPLORE_COPY.updates.label}`,
      tagline: "Explore Osaka, Kyoto, Kobe, Nara & Beyond.",
    },
    more: { href: exploreHref(), label: "View all in Explore Kansai" },
    emptyText: EXPLORE_COPY.updates.empty,
  };
}

// --- Home "Explore Kansai" as two slides (2-Slide Redesign V1, 2026-11-15) ---------

/**
 * Slide backgrounds. TEMPORARY: existing Hero photos (rights NOT_VERIFIED,
 * preview only) stand in until the AI-generated Kansai scenes are ready.
 * To swap: put the new files under public/images/v1/explore/ and change the
 * two `src` (and `alt`) values here; nothing else refers to them.
 */
export const EXPLORE_SLIDE_BACKGROUNDS = {
  select: { src: "/images/v1/hero/kyoto/kyoto-yasaka-pagoda-night.jpg", alt: "", placeholder: true },
  updates: { src: "/images/v1/hero/osaka/osaka-dojima-river-night.jpg", alt: "", placeholder: true },
} as const;

export type ExploreSlideCard = {
  id: string;
  href: string;
  title: string;
  category: string;
  area: string;
  image?: { src: string; alt: string; unverified: boolean };
  flags: string[];
};

export type ExploreNewsCard = {
  id: string;
  /** Absent on layout samples (not links). */
  href?: string;
  title: string;
  category: string;
  area: string;
  date?: string;
  flags: string[];
  sample?: boolean;
};

/** Preview-only layout samples while there is no update: placeholders, not news. */
const SAMPLE_COUNT = 5;

export function getExploreHomeSlides() {
  const flags = (status: EditorialStatus) => (V1_PREVIEW && status !== "published" ? [STATUS_LABEL[status].toUpperCase()] : []);
  const select: ExploreSlideCard[] = getSelectArticles().map((a) => {
    const lead = articleSpotIds(a).map(spotById).find((s) => displayPhoto(s));
    const photo = lead ? displayPhoto(lead) : null;
    return {
      id: a.slug,
      href: articleHref(a),
      title: a.title.replace(/^Connectrip Japan Select:\s*/, ""),
      category: a.topic,
      area: areaName(a.area),
      image: photo ? { src: photo.src, alt: photo.alt, unverified: photo.unverified } : undefined,
      flags: flags(a.status),
    };
  });
  const map = AREA_INFO.osaka.mapHref;
  const current = getUpdateLists().current;
  const news: ExploreNewsCard[] =
    current.length > 0
      ? current.map((a) => ({
          id: a.slug,
          href: articleHref(a),
          title: a.title,
          category: a.category,
          area: areaName(a.area),
          date: a.publishedAt ? formatIsoDate(a.publishedAt) : undefined,
          flags: flags(a.status),
        }))
      : V1_PREVIEW
        ? Array.from({ length: SAMPLE_COUNT }, (_, i) => ({
            id: `sample-${i + 1}`,
            title: "Travel update headline (layout sample)",
            category: UPDATE_CATEGORIES[i % UPDATE_CATEGORIES.length],
            area: "Kansai",
            date: "Publish date",
            flags: ["LAYOUT SAMPLE"],
            sample: true,
          }))
        : [];
  return {
    select: {
      eyebrow: EXPLORE_COPY.title,
      title: EXPLORE_COPY.select.label,
      description: EXPLORE_COPY.select.description,
      cards: select,
      map: map ? { href: map, title: EXPLORE_COPY.map.label, description: EXPLORE_COPY.map.description } : undefined,
      more: { href: exploreSelectHref(), label: "All Select guides" },
    },
    updates: {
      eyebrow: EXPLORE_COPY.title,
      title: EXPLORE_COPY.updates.label,
      description: EXPLORE_COPY.updates.description,
      cards: news,
      samples: news.some((n) => n.sample),
      empty: EXPLORE_COPY.updates.empty,
      more: { href: exploreUpdatesHref(), label: "All travel updates" },
    },
    backgrounds: EXPLORE_SLIDE_BACKGROUNDS,
  };
}
