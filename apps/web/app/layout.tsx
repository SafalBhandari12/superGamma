import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "superGamma",
  description: "AI deck generator MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
