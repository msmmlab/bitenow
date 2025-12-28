import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO METADATA
export const metadata: Metadata = {
  title: "BiteNow Noosa | Best Happy Hours, Food Deals & Specials Today",
  description: "Find the best food and drink specials in Noosa right now. Live happy hours, lunch deals, dinner offers, and family value. Save money and eat better with BiteNow.",
  keywords: ["Noosa restaurants", "Noosa happy hour", "cheap eats Noosa", "food deals Sunshine Coast", "best burger Noosa", "kids eat free Noosa", "Noosa Junction", "Hastings Street"],
  openGraph: {
    title: "BiteNow Noosa | Eat Better, Pay Less",
    description: "Real-time guide to Noosa's best restaurant deals and happy hours.",
    type: "website",
    locale: "en_AU",
    siteName: "BiteNow",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// JSON-LD Schema
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BiteNow Noosa",
  "url": "https://bitenow.com.au",
  "description": "Find the best food and drink specials in Noosa right now.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://bitenow.com.au/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-zinc-900 min-h-screen flex justify-center`}
      >
        <div className="w-full max-w-md bg-white dark:bg-black min-h-screen shadow-2xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
