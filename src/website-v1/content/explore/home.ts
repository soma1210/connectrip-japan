import { V1_CONTENT, V1_PREVIEW } from "../../config";
import { exploreHref, exploreSelectHref, exploreUpdatesHref } from "../../routes";
import { displayPhoto, spotById } from "../spots";
import { AREA_INFO } from "./areas";
import { formatIsoDate } from "../../components/format";
import { SELECT_SAMPLES, UPDATE_SAMPLES } from "./homeSamples";
import type { JournalPage } from "../journal";
import { EXPLORE_COPY, STATUS_LABEL, areaName, articleHref, articleSpotIds, getLatestArticles, getSelectArticles, getUpdateLists, type EditorialStatus, type SelectArticle } from "./index";

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
  summary?: string;
  image?: { src: string; alt: string; unverified: boolean };
  flags: string[];
  /** Placeholder article (homeSamples.ts), preview only. */
  sample?: boolean;
};

export type ExploreNewsCard = {
  id: string;
  /** Absent on layout samples (not links). */
  href?: string;
  title: string;
  category: string;
  area: string;
  date?: string;
  image?: { src: string; alt: string };
  flags: string[];
  sample?: boolean;
};


/** A "guide" article's hero photo, under the same rule as spot photos (unverified: preview only). */
function guidePhoto(a: SelectArticle): { src: string; alt: string; unverified: boolean } | null {
  if (a.content.type !== "guide") return null;
  const h = a.content.hero;
  if (!h.rightsConfirmed && !V1_CONTENT) return null;
  return { src: h.src, alt: h.alt, unverified: !h.rightsConfirmed };
}

export function getExploreHomeSlides() {
  const flags = (status: EditorialStatus) => (V1_PREVIEW && status !== "published" ? [STATUS_LABEL[status].toUpperCase()] : []);
  const select: ExploreSlideCard[] = getSelectArticles().map((a) => {
    const lead = articleSpotIds(a).map(spotById).find((s) => displayPhoto(s));
    const photo = lead ? displayPhoto(lead) : guidePhoto(a);
    return {
      id: a.slug,
      href: articleHref(a),
      title: a.title.replace(/^Connectrip Japan Select:\s*/, ""),
      category: a.topic,
      area: a.areaLabel ?? areaName(a.area),
      summary: a.summary,
      image: photo ? { src: photo.src, alt: photo.alt, unverified: photo.unverified } : undefined,
      flags: flags(a.status),
    };
  });
  // Placeholder guide cards (content/explore/homeSamples.ts) are off since 2026-11-15: the eight
  // Select cards are real records (published / in review / draft). Set to true to show them again.
  const SHOW_SELECT_SAMPLES = false;
  if (V1_PREVIEW && SHOW_SELECT_SAMPLES) {
    for (const x of SELECT_SAMPLES) {
      select.push({
        id: x.id,
        href: exploreSelectHref(),
        title: x.title,
        category: x.topic,
        area: x.area,
        summary: x.summary,
        image: { ...x.image, unverified: false },
        flags: ["SAMPLE"],
        sample: true,
      });
    }
  }
  const map = AREA_INFO.osaka.mapHref;
  const current = getUpdateLists().current;
  const news: ExploreNewsCard[] = current.map((a) => ({
    id: a.slug,
    href: articleHref(a),
    title: a.title,
    category: a.category,
    area: areaName(a.area),
    date: a.publishedAt ? formatIsoDate(a.publishedAt) : undefined,
    flags: flags(a.status),
  }));
  // Preview: placeholder updates after the real ones (content/explore/homeSamples.ts).
  if (V1_PREVIEW) {
    for (const x of UPDATE_SAMPLES) {
      news.push({ id: x.id, title: x.title, category: x.category, area: x.area, date: formatIsoDate(x.date), image: x.image, flags: ["SAMPLE"], sample: true });
    }
  }
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
