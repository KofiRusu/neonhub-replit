"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";

function ping(url: string) {
  return fetch(url, { cache: "no-store" })
    .then((r) => ({ ok: r.ok }))
    .catch(() => ({ ok: false }));
}

export function HealthBadge({ className }: { className?: string }) {
  const api = process.env.NEXT_PUBLIC_API_URL;
  const { data } = useQuery({
    queryKey: ["health", api],
    queryFn: () => (api ? ping(`${api.replace(/\/$/, "")}/health`) : Promise.resolve({ ok: false })),
    refetchInterval: 15000,
  });
  const ok = data?.ok ?? false;
  return (
    <span
      className={`${className ?? ""} inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ring-white/15 ${
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      {ok ? "API online" : "API offline"}
    </span>
  );
}


