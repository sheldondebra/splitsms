import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export const defaultOgCopy = {
  alt: "SplitSMS bulk SMS platform and SMS API for Ghana and 190+ countries",
  title: "Bulk SMS for Ghana and 190+ countries",
  subtitle: "Campaigns, OTP API, WordPress, and pay-as-you-go pricing.",
} as const;

async function logoDataUri() {
  const bytes = await readFile(join(process.cwd(), "public/icon.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function clampText(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}...`;
}

export async function createOgImageResponse(input?: {
  title?: string;
  subtitle?: string;
  kicker?: string;
}) {
  const logo = await logoDataUri();
  const title = clampText(input?.title?.trim() || defaultOgCopy.title, 88);
  const subtitle = clampText(input?.subtitle?.trim() || defaultOgCopy.subtitle, 120);
  const kicker = input?.kicker?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0A0A0A",
          color: "#ffffff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ width: 12, height: "100%", background: "#FB7C00" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "58px 72px 54px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={logo} width={80} height={80} alt="" />
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              <span>Split</span>
              <span style={{ color: "#FB7C00" }}>SMS</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {kicker ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#FB7C00",
                  marginBottom: 18,
                }}
              >
                {kicker}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                maxWidth: 980,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 26,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.72)",
                maxWidth: 860,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#FB7C00",
              letterSpacing: "-0.02em",
            }}
          >
            splitsms.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
