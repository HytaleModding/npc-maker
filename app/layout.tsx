import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NPC Builder - HytaleModding",
  description: "Build Hytale NPCs with ease using our intuitive visual editor.",
  authors: [{ name: "Neil Revin", url: "https://itsneil.dev" }],
  creator: "HytaleModding",
  publisher: "HytaleModding",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://npc.hytalemodding.xyz",
    title: "NPC Builder - HytaleModding",
    description: "Build Hytale NPCs with ease using our intuitive visual editor.",
    siteName: "NPC Builder - HytaleModding",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "HytaleModding",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
