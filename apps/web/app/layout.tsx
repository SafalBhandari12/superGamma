import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "superGamma",
  description: "Bento-grid decks from one prompt",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Geist + Geist Mono are what the renderer's tokens ask for. Without
            them the deck silently falls back to a system sans and loses the
            tight tracking the type scale is built around. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@500;600&display=swap"
        />
      </head>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
