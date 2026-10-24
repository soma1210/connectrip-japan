import type { CtaSpec } from "./cta";
import type { ImageAsset } from "./media";
import type { RouteKey } from "./routes";
import type { Tbd } from "./status";

export type NavItem = {
  id: string;
  route: RouteKey;
  href: string;
  label: Tbd<string>;
};

export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "youtube";

export type SocialLink = {
  platform: SocialPlatform;
  href: string;
  /** e.g. the account handle. */
  label: Tbd<string>;
};

export type SiteNav = {
  /**
   * Header navigation. Must include Private Guide (Working Decision, T-03).
   * Other items and their order are PROPOSED. Home is the logo.
   */
  primary: NavItem[];
  /** Always-visible primary CTA, outside the menu: Experiences (T-03). */
  headerCta: CtaSpec<"experiences">;
  footer: {
    links: NavItem[];
    legal: NavItem[];
    /** Account status is NOT_VERIFIED until confirmed. */
    social: Tbd<SocialLink[]>;
  };
};

export type Brand = {
  name: Tbd<string>;
  logo: Tbd<ImageAsset>;
};

/** Everything the shared layout (Header / Footer) needs. */
export type LayoutViewModel = {
  brand: Brand;
  nav: SiteNav;
};
