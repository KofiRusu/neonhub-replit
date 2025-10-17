import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Providers from "../providers/Providers"

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neonhubecosystem.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NeonHub - AI Marketing Platform",
    template: "%s | NeonHub",
  },
  description: "Advanced AI-powered marketing automation platform with predictive analytics, content generation, and team collaboration",
  keywords: ["AI marketing", "marketing automation", "content generation", "predictive analytics", "team collaboration"],
  authors: [{ name: "NeonHub Team" }],
  creator: "NeonHub",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "NeonHub",
    title: "NeonHub - AI Marketing Platform",
    description: "Advanced AI-powered marketing automation platform",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "NeonHub - AI Marketing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeonHub - AI Marketing Platform",
    description: "Advanced AI-powered marketing automation platform",
    images: [`${siteUrl}/og-image.png`],
    creator: "@neonhub",
  },
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
