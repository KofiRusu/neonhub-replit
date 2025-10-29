import type { Metadata } from "next"
import ContentStudioClient from "./ContentStudioClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://neonhubecosystem.com"

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = SITE_URL.replace(/\/$/, "")
  const title = "Content Studio"
  const description = "Plan, schedule, and optimise SEO-driven content with live keyword intelligence."
  const canonical = `${baseUrl}/content`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "NeonHub",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default function ContentPage() {
  const baseUrl = SITE_URL.replace(/\/$/, "")
  return <ContentStudioClient baseUrl={baseUrl} />
}
