"use client"

import Head from "next/head"
import { usePathname } from "next/navigation"

type CanonicalProps = {
  baseUrl: string
  path?: string
}

export default function Canonical({ baseUrl, path }: CanonicalProps) {
  const pathname = usePathname()
  const normalizedBase = baseUrl.replace(/\/$/, "")
  const targetPath = path ?? pathname ?? "/"
  const href = `${normalizedBase}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`

  return (
    <Head>
      <link rel="canonical" href={href} />
    </Head>
  )
}
