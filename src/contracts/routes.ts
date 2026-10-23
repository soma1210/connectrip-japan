/**
 * Page identities from the Sitemap (WORKING_BASELINE, not approved).
 *
 * UI code refers to pages by `RouteKey` and renders the `href` it is given.
 * URLs are PROPOSED and owned by the routing layer — never hard-code paths
 * in components.
 */
export type RouteKey =
  | "home"
  | "experiences"
  | "experienceDetail"
  | "howItWorks"
  | "about"
  | "inquiry"
  | "privacy"
  | "terms";
