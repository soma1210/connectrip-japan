import type { LayoutViewModel, NavItem } from "../navigation";
import { tbd } from "../status";
import { fixtureCta, fixtureHrefs, fixtureText } from "./shared";

function navItem(route: Exclude<NavItem["route"], "experienceDetail">, label: string): NavItem {
  return { id: `nav_${route}`, route, href: fixtureHrefs[route], label: fixtureText(label) };
}

export const layoutFixture: LayoutViewModel = {
  brand: {
    name: fixtureText("Brand name"),
    logo: tbd("Logo not decided (Website Brain §6)"),
  },
  nav: {
    primary: [
      navItem("experiences", "Experiences"),
      navItem("howItWorks", "How It Works"),
      navItem("about", "About"),
    ],
    headerCta: fixtureCta("inquiry", fixtureHrefs.inquiry, "header", "primary", "Inquiry CTA"),
    footer: {
      links: [
        navItem("experiences", "Experiences"),
        navItem("howItWorks", "How It Works"),
        navItem("about", "About"),
        navItem("inquiry", "Inquiry"),
      ],
      legal: [navItem("privacy", "Privacy"), navItem("terms", "Terms")],
      social: tbd("SNS accounts NOT_VERIFIED"),
    },
  },
};
