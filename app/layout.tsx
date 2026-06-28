import type { Metadata, Viewport } from "next";
import AnalyticsConsentManager from "./components/analytics-consent";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qahwavibes.art"),
  title: "Qahwa Vibes",
  description:
    "A cozy virtual café sound mixer for studying, relaxing, and focus.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Qahwa Vibes",
    description:
      "A cozy virtual café sound mixer for studying, relaxing, and focus.",
    url: "https://qahwavibes.art",
    siteName: "Qahwa Vibes",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a1710",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <AnalyticsConsentManager />
      </body>
    </html>
  );
}
