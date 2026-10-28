import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.113"],
  images: {
    qualities: [75, 90],
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
  async redirects() {
    return [
      { source: "/guide-community", destination: "https://connectrip-guide-community.netlify.app/guide-community", permanent: false },
      { source: "/v1/partner/apply", destination: "https://connectrip-partner-survey.netlify.app/partner/survey", permanent: false },
      ...(process.env.WEBSITE_V1_PREVIEW_ROOT === "1" ? [{ source: "/", destination: "/v1", permanent: false }] : []),
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

export default withNextIntl(nextConfig);
