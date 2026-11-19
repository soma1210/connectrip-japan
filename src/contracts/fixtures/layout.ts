import type { LayoutViewModel, NavItem } from "../navigation";
import type { ParameterizedRouteKey } from "../routes";
import { tbd } from "../status";
import { fixtureCta, fixtureHrefs, fixtureText } from "./shared";

function navItem(route: Exclude<NavItem["route"], ParameterizedRouteKey>, label: string): NavItem {
  return { id: `nav_${route}`, route, href: fixtureHrefs[route], label: fixtureText(label) };
}

/**
 * Header: Private Guide in navigation and Experiences as the primary CTA are
 * Working Decisions (T-03). Other items and their order are PROPOSED.
 */
export const layoutFixture: LayoutViewModel = {
  brand: {
    name: fixtureText("Brand name"),
    logo: tbd("Logo not decided (Website Brain §6)"),
  },
  nav: {
    primary: [
      navItem("experiences", "Experiences"),
      navItem("privateGuide", "Private Guide"),
      navItem("travelGuide", "Osaka Travel Guide"),
      navItem("howItWorks", "How It Works"),
      navItem("about", "About"),
    ],
    headerCta: fixtureCta("experiences", fixtureHrefs.experiences, "header", "primary", "Header CTA"),
    footer: {
      links: [
        navItem("experiences", "Experiences"),
        navItem("privateGuide", "Private Guide"),
        navItem("travelGuide", "Osaka Travel Guide"),
        navItem("howItWorks", "How It Works"),
        navItem("about", "About"),
        navItem("inquiry", "Inquiry"),
      ],
      legal: [navItem("privacy", "Privacy"), navItem("terms", "Terms")],
      social: tbd("SNS accounts NOT_VERIFIED"),
    },
  },
};
