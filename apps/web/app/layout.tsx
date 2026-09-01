import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "superGamma — bento decks from one prompt",
    template: "%s · superGamma",
  },
  description:
    "Describe the deck. Get a designed bento-grid presentation with real charts, five themes, and an editable .pptx export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Dark-mode and reader extensions (Night Eye, Dark Reader, Grammarly)
    // stamp their own attributes onto <html> before React hydrates, which
    // React then reports as a mismatch on every page load. This suppresses the
    // warning for this element's own attributes only — one level deep, never
    // for children — so a real mismatch anywhere in the tree still surfaces.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Geist + Geist Mono are what the renderer's tokens ask for. Without
            them the deck silently falls back to a system sans and loses the
            tight tracking the type scale is built around. The app chrome is
            set in the same faces so the page and the slides read as one thing.

            Fraunces is the display serif — variable on optical size, so one
            file covers a 44px tile heading and a 68px hero without either
            looking like the other scaled. It is only ever used for h1/h2. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..700,0,0&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500;600&display=swap"
        />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
