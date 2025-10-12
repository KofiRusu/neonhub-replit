import { createTRPCNext } from "@trpc/next"
import { httpBatchLink } from "@trpc/client"
import type { AppRouter } from "../../../Neon-v2.4.0/src/server/api/root"

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "" // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              // Add authentication headers if needed
              authorization: typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "",
            }
          },
        }),
      ],
    }
  },
  ssr: false,
})
