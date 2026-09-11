import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
  title: "KalaCUBE — Art Lives Here",
  description:
    "A World of Art. In One Cube. Discover visual art, handicraft and performing arts — and connect with the artists behind the work.",
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
        <AmplifyProvider>
          <Header />
          {children}
          <Footer />
        </AmplifyProvider>
      </body>
    </html>
  );
}
