import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "./constants";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;

let logoSrc: Promise<string> | undefined;
const getLogo = () =>
  (logoSrc ??= readFile(join(process.cwd(), "public/brand/logo.png"), "base64").then(
    (b64) => `data:image/png;base64,${b64}`,
  ));

/** Branded 1200×630 share image (logo on cream). Used by opengraph-image & twitter-image. */
export async function renderBrandImage() {
  const logo = await getLogo();
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
          background: "#faf8f5",
          border: "24px solid #ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={684} height={300} alt="" />
        <div
          style={{
            marginTop: 36,
            fontSize: 26,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#6f6a64",
          }}
        >
          {`${SITE_TAGLINE} · Cash on Delivery`}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
