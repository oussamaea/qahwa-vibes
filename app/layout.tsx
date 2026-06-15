import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qahwa Vibes",
  description:
    "A cozy café corner for studying, relaxing, and getting lost in the mood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
