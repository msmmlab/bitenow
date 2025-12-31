import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title:
    "BiteNow Sunshine Coast | Live Food & Drink Specials in Noosa, Mooloolaba, Maroochydore & More",

  description:
    "Find live food and drink specials across the Sunshine Coast. Discover happy hours, lunch deals, dinner offers, and local favourites in Noosa, Mooloolaba, Maroochydore, Caloundra, Coolum Beach and nearby towns — updated daily.",

  keywords: [
    "Sunshine Coast food deals",
    "Sunshine Coast happy hour",
    "Noosa restaurants",
    "Noosa happy hour",
    "Mooloolaba restaurants",
    "Mooloolaba happy hour",
    "Maroochydore food deals",
    "Caloundra restaurants",
    "Coolum Beach restaurants",
    "cheap eats Sunshine Coast",
    "lunch specials Sunshine Coast",
    "dinner deals Sunshine Coast",
    "live food specials Sunshine Coast"
  ],

  openGraph: {
    title:
      "BiteNow Sunshine Coast | Live Food & Drink Specials Near You",
    description:
      "A real-time guide to food and drink specials across the Sunshine Coast — from Noosa to Caloundra. Find happy hours, lunch deals and local favourites happening today.",
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
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-zinc-900 min-h-screen flex justify-center`}
      >
        <div className="w-full max-w-md md:max-w-none bg-white dark:bg-black min-h-screen shadow-2xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
