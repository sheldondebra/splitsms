import { ImageResponse } from "next/og";

export const alt = "SplitSMS — Bulk SMS Platform & SMS API for 190+ Countries";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1208 45%, #2a1400 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "#FF6A00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              display: "flex",
            }}
          >
            Split<span style={{ color: "#FF6A00" }}>SMS</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "42px",
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: "920px",
            letterSpacing: "-0.03em",
          }}
        >
          Bulk SMS Platform & SMS API
        </div>
        <div
          style={{
            marginTop: "24px",
            fontSize: "28px",
            color: "rgba(255,255,255,0.78)",
            maxWidth: "900px",
            lineHeight: 1.35,
          }}
        >
          Ghana, Nigeria & 190+ countries · OTP · WooCommerce · REST API · Pay-as-you-go
        </div>
      </div>
    ),
    { ...size },
  );
}
