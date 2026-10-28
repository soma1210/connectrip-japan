import type { AboutViewModel, LayoutViewModel, LegalPageViewModel, NavItem } from "@/contracts";
import { recruitHref, routeHref, type StaticRouteKey } from "../routes";
import { baselineText, cta, pageName, pageSeo, proposed, tbd } from "./shared";
import { getGuideSlots } from "./people";
import { socialLinks } from "@/data/social-links";

const PAGE_NAMES: Record<Exclude<StaticRouteKey, "home">, string> = {
  experiences: "Experiences",
  privateGuide: "Private Guide",
  travelGuide: "Osaka Travel Guide",
  howItWorks: "How It Works",
  about: "About",
  inquiry: "Inquiry",
  privacy: "Privacy Policy",
  terms: "Terms",
  // Current site Footer labels (messages/en.json footer.information).
  company: "Company Profile",
  cancelPolicy: "Cancellation Policy",
  businessInquiry: "Business Inquiries",
  connectripSelect: "Connectrip Select",
  // Not in the navigation: reached after a Private Guide booking (PROTOTYPE).
  privateDayPlanner: "Private Day Planner",
  privateGuideBooking: "Book a Private Guide",
};

function navItem(route: Exclude<StaticRouteKey, "home">): NavItem {
  return { id: `v1_nav_${route}`, route, href: routeHref(route), label: pageName(PAGE_NAMES[route]) };
}

/**
 * RECRUIT group (Human instruction 2026-10-27): a header dropdown, a mobile
 * accordion and Footer INFORMATION links. Website-local, not part of
 * `LayoutViewModel`, because recruiting pages have no shared `RouteKey`.
 * `external`: Guide Community has its own root layout, so it needs a full page load.
 */
export type RecruitLink = { id: string; href: string; label: string; external: boolean };
export type RecruitNav = { label: string; items: RecruitLink[] };

export function getRecruitNav(): RecruitNav {
  return {
    label: "RECRUIT",
    items: [
      { id: "v1_nav_recruit_guide", href: recruitHref("guideCommunity"), label: "Guide Recruitment", external: true },
      { id: "v1_nav_recruit_partner", href: recruitHref("partner"), label: "Partner Recruitment", external: false },
    ],
  };
}

/**
 * Header: Experiences is the primary CTA and Private Guide is in the
 * navigation (W1-D02). Other items and their order are PROPOSED.
 */
export function getLayoutViewModel(): LayoutViewModel {
  return {
    brand: {
      name: proposed("Connectrip Japan", "Current site brand name"),
      logo: proposed(
        { src: "/images/logo/logo.png", alt: "Connectrip Japan", width: 1254, height: 1254, rights: "NOT_VERIFIED", consent: "NOT_APPLICABLE" },
        "Current site logo. Website Brain §6: logo TBD",
      ),
    },
    nav: {
      primary: [navItem("privateGuide"), navItem("travelGuide"), navItem("howItWorks"), navItem("about")],
      headerCta: cta("v1_header_experiences", "experiences", routeHref("experiences"), "header", "primary", pageName("Experiences")),
      footer: {
        links: [
          navItem("experiences"),
          navItem("privateGuide"),
          navItem("travelGuide"),
          navItem("howItWorks"),
          navItem("about"),
          navItem("inquiry"),
        ],
        legal: [
          navItem("company"),
          navItem("cancelPolicy"),
          navItem("businessInquiry"),
          navItem("privacy"),
          navItem("terms"),
        ],
        // Same accounts and order as the current site's Footer (data/social-links).
        social: proposed(
          (["tiktok", "instagram", "whatsapp", "facebook"] as const).map((platform) => ({
            platform,
            href: socialLinks[platform],
            label: proposed(
              { tiktok: "TikTok", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" }[platform],
              "Current site Footer",
            ),
          })),
          "Current site Footer SNS links (data/social-links). WORKING_BASELINE (W1-D08)",
        ),
      },
    },
  };
}

export function getAboutViewModel(): AboutViewModel {
  return {
    route: "about",
    seo: pageSeo("About", routeHref("about")),
    content: {
      intro: { headline: pageName("About"), supporting: tbd("About intro copy TBD") },
      guides: { heading: baselineText("Meet Our Guides"), people: getGuideSlots() },
      company: { heading: tbd("Company section heading TBD"), facts: tbd("Company / legal claims TBD") },
      experiencesCta: cta("v1_about_experiences", "experiences", routeHref("experiences"), "section", "primary", pageName("Experiences")),
      privateGuideCta: cta("v1_about_private", "privateGuide", routeHref("privateGuide"), "section", "secondary", pageName("Private Guide")),
    },
  };
}

export function getLegalViewModel<K extends "privacy" | "terms">(route: K): LegalPageViewModel<K> {
  const name = PAGE_NAMES[route];
  return {
    route,
    seo: pageSeo(name, routeHref(route)),
    content: {
      title: pageName(name),
      updatedAt: tbd(),
      sections: tbd(
        route === "privacy"
          ? "Privacy Policy text requires human / legal approval (Website Brain L-03, L-04)"
          : "Terms text requires human / legal approval (Website Brain L-01, L-05, L-06)",
      ),
    },
  };
}
