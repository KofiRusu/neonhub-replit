"use client";

import { useQuery } from "@tanstack/react-query";
import { nh } from "@neonhub/sdk";

type TimelineProps = {
  personId: string;
};

export default function Timeline({ personId }: TimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["events", personId],
    queryFn: () => nh.events.timeline(personId, { limit: 50 }),
  });

  if (isLoading) {
    return <div className="rounded-xl border p-3 text-sm">Loading events…</div>;
  }

  const events = data?.events ?? [];

  if (events.length === 0) {
    return <div className="rounded-xl border p-3 text-sm">No events yet.</div>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-xl border p-3">
          <div className="text-sm opacity-70">
            {event.type} · {new Date(event.ts).toLocaleString()}
          </div>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
