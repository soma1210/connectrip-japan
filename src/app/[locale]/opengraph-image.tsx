import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Connectrip Japan";

export default async function Image() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/images/logo/logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#162e4c",
        }}
      >
        <img src={logoSrc} width={160} height={160} alt="" />
        <div
          style={{
            marginTop: 32,
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#c9a45c",
          }}
        >
          CONNECTRIP JAPAN
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#f5f3ee",
            opacity: 0.85,
          }}
        >
          Kansai Travel Support for Visitors to Japan
        </div>
      </div>
    ),
    { ...size },
  );
}
