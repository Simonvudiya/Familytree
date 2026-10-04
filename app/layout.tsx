import type { Metadata, Viewport } from "next";
import { Inter, Merriweather, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/hooks/useUser";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Family History",
  description: "Preserve, share, and celebrate your family's story across generations",
  keywords: ["family history", "genealogy", "family tree", "memoir", "autobiography", "family stories"],
  authors: [{ name: "Family History Platform" }],
  creator: "Family History Platform",
  publisher: "Family History Platform",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://familyhistory.example.com",
    title: "Our Family History",
    description: "Preserve, share, and celebrate your family's story across generations",
    siteName: "Our Family History",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Family History",
    description: "Preserve, share, and celebrate your family's story across generations",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}