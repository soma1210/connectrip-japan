import type { NextConfig } from "next";

/**
 * Public mode only (Website v1 at the site root, see src/proxy.ts).
 *
 * - `/v1/*` → the same path at the root (301). Pages outside the launch scope
 *   then answer 404 at the root.
 * - Old current-site URLs: only those with a real English equivalent, one by
 *   one (Human instruction 2026-11-11). `/company` and `/cancel-policy` keep
 *   their URL (served by v1). Not redirected on purpose (no equivalent; they
 *   answer 404): `/pricing`, `/careers`, `/business-inquiry`, and every
 *   non-English locale (`/ja`, `/vi`, `/ko`, `/zh-TW` and their sub-pages).
 */
const PUBLIC_MODE_REDIRECTS = [
  { source: "/partner/apply", destination: "https://docs.google.com/forms/d/e/1FAIpQLSfl91wJlinZ4i178QnBE_zS4Rd3O4JPXerJT4LT8_MQgz2_0g/viewform", permanent: false },
  { source: "/v1", destination: "/", statusCode: 301 as const },
  { source: "/v1/:path*", destination: "/:path*", statusCode: 301 as const },
  { source: "/en", destination: "/", statusCode: 301 as const },
  { source: "/en/company", destination: "/company", statusCode: 301 as const },
  { source: "/en/cancel-policy", destination: "/cancel-policy", statusCode: 301 as const },
  { source: "/contact", destination: "/inquiry", statusCode: 301 as const },
  { source: "/en/contact", destination: "/inquiry", statusCode: 301 as const },
  { source: "/reservation", destination: "/private-guide", statusCode: 301 as const },
  { source: "/en/reservation", destination: "/private-guide", statusCode: 301 as const },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.113"],
  images: {
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // Local Website v1 preview only (`bun run dev:v1`, port 3002): open the
  // preview at the root. Without WEBSITE_V1_PREVIEW_ROOT nothing changes.
  //
  // Connectrip uses one official URL per form; this app's copies of the guide
  // form and the partner survey send people there instead (admin stays here).
  // The partner survey's official URL is the Partner Google Form (2026-11-02),
  // the guide form's is the Guide Google Form (2026-11-11).
  async redirects() {
    return [
      // One host for search engines (2026-11-25 SEO audit): www served the same pages with a 200.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.connectripjapan.com" }],
        destination: "https://connectripjapan.com/:path*",
        permanent: true,
      },
      // Guide applications: the Guide Google Form (2026-11-11). The in-site form
      // under src/app/guide-community and its API/data are kept, not served.
      {
        source: "/guide-community",
        destination: "https://docs.google.com/forms/d/e/1FAIpQLScUcnWv2X9W64-UyRaPi_e6-rXVRD8AnzCh5C6CSjfbXZ_lIA/viewform",
        permanent: false,
      },
      {
        source: "/v1/partner/apply",
        destination: "https://docs.google.com/forms/d/e/1FAIpQLSfl91wJlinZ4i178QnBE_zS4Rd3O4JPXerJT4LT8_MQgz2_0g/viewform",
        permanent: false,
      },
      ...(process.env.WEBSITE_V1_PREVIEW_ROOT === "1" ? [{ source: "/", destination: "/v1", permanent: false }] : []),
      ...(process.env.NEXT_PUBLIC_WEBSITE_V1_PREVIEW === "1" ? [] : PUBLIC_MODE_REDIRECTS),
    ];
  },
  // Netlify test deploys (*.netlify.app): keep every page, including HTML
  // rendered by the Next.js server, out of search engines. netlify.toml headers
  // only reach static files. Matched by host, so a custom domain
  // (connectripjapan.com) is not affected.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.netlify\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
