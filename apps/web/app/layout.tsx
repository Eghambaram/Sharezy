import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { DevModeBanner } from "@/components/dev-mode-banner";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { isDevAuth } from "@/lib/env";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "DataExchange", template: "%s · DataExchange" },
  description: "Enter once. Share anywhere. Share only the details you choose, with a clear purpose.",
  applicationName: "DataExchange",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1f4d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const app = (
    <>
      <DevModeBanner />
      <Providers>{children}</Providers>
    </>
  );
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {/* Clerk mounts only in clerk mode; dev mode never loads provider keys. */}
        {isDevAuth ? app : <ClerkProvider appearance={clerkAppearance}>{app}</ClerkProvider>}
      </body>
    </html>
  );
}
