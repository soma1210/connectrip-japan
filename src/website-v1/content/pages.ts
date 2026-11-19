import { V1_CONTENT } from "../config";
import type { AboutSection, AboutValue, AboutViewModel, LayoutViewModel, LegalPageViewModel, NavItem } from "@/contracts";
import { approved } from "@/contracts/status";
import { isPublicHref, recruitHref, routeHref, type StaticRouteKey } from "../routes";
import { approvedText, cta, pageName, pageSeo, proposed, tbd } from "./shared";
import { getCompanyProfileViewModel } from "./currentSitePages";
import { TERMS_SECTIONS, TERMS_SOURCE, TERMS_TITLE, TERMS_UPDATED_AT } from "./termsOfService";
import { socialLinks } from "@/data/social-links";

const PAGE_NAMES: Record<Exclude<StaticRouteKey, "home">, string> = {
  experiences: "Experiences",
  privateGuide: "Private Guide",
  // The travel media hub (2026-11-14): Explore Kansai. Preview only (not in PUBLIC_PATHS), so public nav is unchanged.
  travelGuide: "Explore Kansai",
  howItWorks: "How It Works",
  about: "About",
  inquiry: "Inquiry",
  privacy: "Privacy Policy",
  terms: "Terms",
  // Current site Footer labels (messages/en.json footer.information).
  company: "Company Profile",
  cancelPolicy: "Cancellation Policy",
  businessInquiry: "Business Inquiries",
  connectripSelect: "Osaka Map",
};

function navItem(route: Exclude<StaticRouteKey, "home">): NavItem {
  return { id: `v1_nav_${route}`, route, href: routeHref(route), label: pageName(PAGE_NAMES[route]) };
}

/** "How It Works" points at the Home section, which is shown in the preview only. */
function howItWorksNav(): NavItem[] {
  return V1_CONTENT ? [navItem("howItWorks")] : [];
}

/**
 * RECRUIT group (Human instruction 2026-10-27): a header dropdown, a mobile
 * accordion and Footer INFORMATION links. Website-local, not part of
 * `LayoutViewModel`, because recruiting pages have no shared `RouteKey`.
 * `external`: Google Form URLs, rendered as a plain `<a>` opening a new tab.
 */
export type RecruitLink = { id: string; href: string; label: string; external: boolean };
export type RecruitNav = { label: string; items: RecruitLink[] };

export function getRecruitNav(): RecruitNav {
  return {
    label: "RECRUIT",
    items: [
      { id: "v1_nav_recruit_guide", href: recruitHref("guideCommunity"), label: "Guide Recruitment", external: recruitHref("guideCommunity").startsWith("http") },
      { id: "v1_nav_recruit_partner", href: recruitHref("partner"), label: "Partner Recruitment", external: recruitHref("partner").startsWith("http") },
    ],
  };
}

/**
 * Footer (Human instruction 2026-11-14): three groups, Navigation /
 * Information / Legal. Footer-only labels ("About Us", "Contact Us",
 * "For Business", "Terms & Conditions"); the pages and URLs are unchanged.
 */
const FOOTER_SOURCE = "Footer structure and labels (Human instruction 2026-11-14)";

function footerItem(route: Exclude<StaticRouteKey, "home">, label: string): NavItem {
  return { id: `v1_footer_${route}`, route, href: routeHref(route), label: proposed(label, FOOTER_SOURCE) };
}

/**
 * About Us now carries all of the Company Profile information, so the footer
 * links About only. While About is not public (public mode: 404), the footer
 * keeps Company Profile in its place so the company details stay linked.
 */
function footerAboutItem(): NavItem {
  return isPublicHref(routeHref("about")) ? footerItem("about", "About Us") : footerItem("company", "Company Profile");
}

/** A footer Information link. `external`: a Google Form, opened in a new tab. */
export type FooterLink = { id: string; href: string; label: string; external: boolean };

export function getFooterInformation(): FooterLink[] {
  const item = (id: string, href: string, label: string): FooterLink => ({ id, href, label, external: /^https?:\/\//.test(href) });
  return [
    item("v1_footer_contact", routeHref("inquiry"), "Contact Us"),
    // "For Business" removed for now (Human instruction 2026-11-18): it overlaps with "Become a Partner".
    // The Business Inquiries page and URL are unchanged. To restore:
    // item("v1_footer_business", routeHref("businessInquiry"), "For Business"),
    // Same targets as the header RECRUIT menu.
    item("v1_footer_guide", recruitHref("guideCommunity"), "Become a Guide"),
    item("v1_footer_partner", recruitHref("partner"), "Become a Partner"),
  ];
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
      // How It Works: the Home section (its page was removed 2026-11-15); preview only, like that section.
      primary: [navItem("privateGuide"), navItem("travelGuide"), ...howItWorksNav(), navItem("about")],
      // Same labels and destinations as the Home Hero CTAs (Human instruction 2026-11-09).
      // Red CTA "Explore Our Tours" (Human instruction 2026-11-11): its final target is the
      // Tenmangu / Tenjinbashi-suji / Tenma Market tour page, not built yet. Until then it
      // points at the preview-only Experiences page, so public mode does not render it
      // (CtaLink). When the tour page ships: change the href and add it to PUBLIC_PATHS.
      headerCta: cta("v1_header_experiences", "experiences", routeHref("experiences"), "header", "primary", proposed("Explore Our Tours", "Header CTA (Human instruction 2026-11-11)")),
      headerSecondaryCta: cta("v1_header_private", "privateGuide", routeHref("privateGuide"), "header", "secondary", proposed("Plan a Private Day", "Header CTA (Human instruction 2026-11-09)")),
      footer: {
        // NAVIGATION. Contact moved to Information (getFooterInformation).
        links: [navItem("experiences"), navItem("privateGuide"), navItem("travelGuide"), ...howItWorksNav(), footerAboutItem()],
        // LEGAL. Company Profile is covered by About; Business Inquiries is not in the footer for now (2026-11-18).
        legal: [navItem("privacy"), footerItem("terms", "Terms & Conditions"), navItem("cancelPolicy")],
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

const ABOUT_SOURCE = "Human instruction 2026-11-14 (About Us structure and wording)";
const MVV_SOURCE = "Official Mission, Vision & Values copy (Human instruction 2026-11-16)";

/** Our Values (official copy, 2026-11-16): number, name, headline, description. */
const ABOUT_VALUES: AboutValue[] = [
  { number: "01", name: "CONNECT", headline: "Creating Meaningful Connections", text: "We bring people together, creating meaningful connections that go beyond travel." },
  { number: "02", name: "TRUST", headline: "Building Lasting Trust", text: "We act with honesty, integrity, and responsibility to build lasting relationships." },
  { number: "03", name: "SPEED", headline: "Acting with Speed and Purpose", text: "We think fast, act decisively, and adapt to change while maintaining quality and safety." },
  { number: "04", name: "HOSPITALITY", headline: "Going Beyond Expectations", text: "We put people first, delivering thoughtful service and experiences that exceed expectations." },
  { number: "05", name: "RESPECT", headline: "Respecting Every Individual and Culture", text: "We embrace diversity, respect different cultures and perspectives, and treat everyone with dignity." },
  { number: "06", name: "CHALLENGE", headline: "Embracing New Possibilities", text: "We embrace new possibilities, learn from challenges, and continuously strive to create a better future." },
];
/**
 * Company Overview facts: every row of the Company Profile page, in the same
 * order and wording (Footer consolidation, 2026-11-14), so About carries all
 * of the company information and the footer no longer needs Company Profile.
 * Not new claims: same source and status as the Company Profile page.
 */
function companyOverviewFacts(): AboutSection["facts"] {
  const profile = getCompanyProfileViewModel().content;
  if (profile.status === "TBD") return tbd("Company facts TBD");
  return proposed(
    // Already adjusted in currentSitePages.ts: the representative's official title (content/officers.ts)
    // and the rows hidden before the travel agency registration (HIDDEN_COMPANY_ROWS).
    profile.value.rows.map((r) => ({ label: proposed(r.label, profile.source), value: proposed(r.value, profile.source), note: r.note })),
    `${profile.source}. Same data as the Company Profile page`,
  );
}

/**
 * About Us (2026-11-14): page structure only. Hero wording, the section names
 * and the philosophy line come from the instruction. Mission, Vision, Values
 * and the closing statement: official copy (2026-11-16). The overview and
 * philosophy copy is still TBD (placeholders, shown in the preview only).
 * Not in PUBLIC_PATHS: public mode answers 404.
 */
export function getAboutViewModel(): AboutViewModel {
  const section = (key: AboutSection["key"], title: string, extra: Partial<AboutSection> = {}): AboutSection => ({
    key,
    title,
    statement: tbd(`${title}: statement TBD (next phase)`),
    body: tbd(`${title}: copy TBD (next phase)`),
    ...extra,
  });
  return {
    route: "about",
    seo: pageSeo("About Us", routeHref("about")),
    content: {
      intro: {
        eyebrow: approvedText("Connectrip Japan", ABOUT_SOURCE),
        headline: approvedText("About Us", ABOUT_SOURCE),
        tagline: approvedText("Connecting People. Creating Experiences.", ABOUT_SOURCE),
      },
      sections: [
        section("companyOverview", "Company Overview", {
          statement: tbd("Company Overview: summary TBD (next phase)"),
          facts: companyOverviewFacts(),
        }),
        section("philosophy", "Our Philosophy", {
          statement: approvedText("Connecting People. Creating Experiences.", ABOUT_SOURCE),
        }),
        section("mission", "Our Mission", {
          statement: approvedText("Connecting People Through Travel.", MVV_SOURCE),
          body: approved(
            [
              "We believe the true value of travel lies not only in the places we visit, but in the people we meet and the connections we create.",
              "Through meaningful experiences, we bring travelers and local communities together, building bridges across cultures, languages, and borders.",
            ],
            MVV_SOURCE,
          ),
        }),
        section("vision", "Our Vision", {
          statement: approvedText("Passing the Wonder of Travel Through Generations.", MVV_SOURCE),
          body: approved(
            [
              "We envision a future where the wonder of travel lives on through generations.",
              "By preserving Japan's rich culture and traditions, creating unforgettable experiences, and connecting people through travel, we strive to inspire memories and stories that will be shared for generations to come.",
            ],
            MVV_SOURCE,
          ),
        }),
        section("values", "Our Values", {
          statement: approvedText("The Six Values That Guide Us", MVV_SOURCE),
          // The values themselves are the copy: no paragraph above the grid.
          body: approved([], MVV_SOURCE),
          values: ABOUT_VALUES,
        }),
      ],
      closing: {
        eyebrow: "CONNECTRIP JAPAN",
        statement: "Connecting People Through Travel.",
        lines: ["Every connection creates a story.", "Every story inspires the next generation."],
      },
      experiencesCta: cta("v1_about_experiences", "experiences", routeHref("experiences"), "section", "primary", pageName("Experiences")),
      privateGuideCta: cta("v1_about_private", "privateGuide", routeHref("privateGuide"), "section", "secondary", pageName("Private Guide")),
    },
  };
}

export function getLegalViewModel<K extends "privacy" | "terms">(route: K): LegalPageViewModel<K> {
  const name = PAGE_NAMES[route];
  // Terms: the owner's Terms of Service text (content/termsOfService.ts, 2026-11-18).
  if (route === "terms") {
    return {
      route,
      seo: { ...pageSeo(TERMS_TITLE, routeHref(route)), title: approved(TERMS_TITLE, TERMS_SOURCE) },
      content: {
        title: approved(TERMS_TITLE, TERMS_SOURCE),
        updatedAt: approved(TERMS_UPDATED_AT, TERMS_SOURCE),
        sections: approved(TERMS_SECTIONS, TERMS_SOURCE),
      },
    };
  }
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
