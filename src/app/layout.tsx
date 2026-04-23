import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://recon.sakil.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "recon · solana alpha agent",
    template: "%s · recon",
  },
  description:
    "Two Claude models fight over every new Solana token. A third picks a side. All of it lives on a public feed — winners, losers, split decisions.",
  applicationName: "recon",
  keywords: ["solana", "alpha", "memecoin", "birdeye", "claude", "agent", "ai"],
  openGraph: {
    type: "website",
    siteName: "recon",
    title: "recon · solana alpha agent",
    description:
      "Two Claude models fight over every new Solana token. A third picks a side. All of it lives on a public feed.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "recon · solana alpha agent",
    description:
      "Two Claude models fight over every new Solana token. A third picks a side.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <body className="bg-[var(--bg)] text-[var(--text)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
