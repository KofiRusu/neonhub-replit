"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import SessionProvider from "./SessionProvider";
import { setTransport } from "@neonhub/sdk/client";
import { mockTransport } from "@/mocks/nhTransport";
import { createTRPCClient, trpc } from "@/lib/trpc";

const shouldUseMockTransport =
  (process.env.NEXT_PUBLIC_NH_USE_MOCKS ?? "false").toLowerCase() === "true";

if (shouldUseMockTransport) {
  // Phase 4 SDK alignment: default to real API, only opt into mocks explicitly.
  setTransport(mockTransport);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => createTRPCClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <trpc.Provider client={trpcClient} queryClient={client}>{children}</trpc.Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
