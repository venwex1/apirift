import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ApiRift — Know before it breaks",
    template: "%s — ApiRift",
  },
  description:
    "ApiRift watches every API your product depends on — changelogs, deprecations, incidents — and tells you what will break you, before it does.",
  openGraph: {
    type: "website",
    siteName: "ApiRift",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080D",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#2EE6A8",
          colorBackground: "#0B0E15",
          colorText: "#E8EDF4",
        },
      }}
    >
      <html lang="en" className={`${display.variable} ${mono.variable} dark`}>
        <body className="font-display">
          <PostHogProvider>{children}</PostHogProvider>
          <Toaster theme="dark" position="bottom-right" />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
