import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WebVitals from "@/components/WebVitals";

// Primary UI family per the KalaCUBE brand guideline (Poppins 400–800).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Editorial display face — a high-contrast contemporary serif, used sparingly
// for cultural/magazine-style headlines (brand guideline §05 Typography).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kalacube.com"),
  title: {
    default: "KalaCUBE — A Home for India's Artists | Art Lives Here",
    template: "%s — KalaCUBE",
  },
  description:
    "Discover India's artists across Handicraft, Visual Art and Performing Arts. Explore original work by art style and connect with the makers behind it. Art Lives Here.",
  keywords: [
    "KalaCUBE",
    "Indian artists",
    "handicraft",
    "visual art",
    "performing arts",
    "original art India",
    "art gallery online",
    "discover artists",
    "handmade art",
    "artist portfolio",
    "Musée Art Café",
  ],
  applicationName: "KalaCUBE",
  authors: [{ name: "KalaCUBE" }],
  creator: "KalaCUBE",
  publisher: "KalaCUBE",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "KalaCUBE",
    locale: "en_IN",
    url: "https://kalacube.com",
    title: "KalaCUBE — A Home for India's Artists",
    description:
      "Discover India's artists across Handicraft, Visual Art and Performing Arts. Explore original work and connect with the makers. Art Lives Here.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KalaCUBE — A Home for India's Artists",
    description:
      "Discover India's artists across Handicraft, Visual Art and Performing Arts. Art Lives Here.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "art",
};

// Organization + WebSite structured data for search + AI answer engines.
// WebSite.potentialAction exposes the gallery as the site's search surface.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KalaCUBE",
  url: "https://kalacube.com",
  logo: "https://kalacube.com/brand/logo-primary.png",
  description:
    "A home for India's artists across Handicraft, Visual Art and Performing Arts — showcase, discover, and connect.",
  slogan: "Art Lives Here",
  foundingDate: "2020",
  sameAs: ["https://www.museeliving.com"],
  parentOrganization: {
    "@type": "Organization",
    name: "Musée Art Café",
    url: "https://www.museeliving.com",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KalaCUBE",
  alternateName: "KalaCUBE — Art Lives Here",
  url: "https://kalacube.com",
  description:
    "A home for India's artists across Handicraft, Visual Art and Performing Arts.",
  publisher: { "@type": "Organization", name: "KalaCUBE" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://kalacube.com/explore?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-navy-deep">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AmplifyProvider>
          <Header />
          {children}
          <Footer />
        </AmplifyProvider>

        {/* Google Analytics 4 — loads on every page; GA4 enhanced measurement
            auto-tracks SPA route changes, so the base config is sufficient. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TP8KDLQR1Z"
          strategy="beforeInteractive"
        />
        <Script id="ga4" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TP8KDLQR1Z');`}
        </Script>
        {/* Report Core Web Vitals (page speed/performance) to GA4. */}
        <WebVitals />
      </body>
    </html>
  );
}
