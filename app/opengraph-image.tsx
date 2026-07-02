import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Upstream — Know before it breaks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#06080D",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 20 L9 12 L13 15 L21 4"
              stroke="#2EE6A8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="21" cy="4" r="2.4" fill="#2EE6A8" />
          </svg>
          <span style={{ color: "#E8EDF4", fontSize: "36px", fontWeight: 600 }}>
            upstream
          </span>
        </div>
        <div
          style={{
            marginTop: "48px",
            color: "#E8EDF4",
            fontSize: "76px",
            fontWeight: 700,
            letterSpacing: "-2px",
          }}
        >
          Know before it breaks.
        </div>
        <div style={{ marginTop: "24px", color: "#8A94A6", fontSize: "30px", maxWidth: "900px" }}>
          Autonomous monitoring for every API your product depends on.
        </div>
        <div
          style={{
            marginTop: "56px",
            height: "3px",
            width: "280px",
            background: "#2EE6A8",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
