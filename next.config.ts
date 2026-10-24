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
  async redirects() {
    return process.env.WEBSITE_V1_PREVIEW_ROOT === "1"
      ? [{ source: "/", destination: "/v1", permanent: false }]
      : [];
  },
};

export default withNextIntl(nextConfig);
