/**
 * Next.js 15 Client Component Example
 * Use in app/(dashboard)/contacts/[id]/timeline.tsx
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { NeonHubClient } from '@neonhub/sdk';
import { mockTransport } from '@neonhub/sdk/mocks';
import { setTransport } from '@neonhub/sdk';

// For development: use mock transport
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
  setTransport(mockTransport);
}

const nh = new NeonHubClient({
  baseURL: process.env.NEXT_PUBLIC_NH_API_URL || 'http://localhost:4000',
  apiKey: process.env.NEXT_PUBLIC_NH_API_KEY || 'mock-key',
});

interface TimelineProps {
  personId: string;
}

export default function Timeline({ personId }: TimelineProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['timeline', personId],
    queryFn: async () => {
      const events = await nh.events.getTimeline(personId, {
        limit: 50,
        includeMemory: true,
      });
      return events;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load timeline: {(error as Error).message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Activity Timeline</h2>
      
      {data.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <EventIcon type={event.type} />
                <span className="font-medium text-gray-900">
                  {formatEventType(event.type)}
                </span>
              </div>
              
              <div className="mt-1 text-sm text-gray-500">
                {event.channel && (
                  <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {event.channel}
                  </span>
                )}
                {' · '}
                {new Date(event.ts).toLocaleString()}
              </div>

              {event.payload && Object.keys(event.payload).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                    View details
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    'email.sent': '📧',
    'email.opened': '👀',
    'email.clicked': '🖱️',
    'email.replied': '💬',
    'sms.sent': '📱',
    'sms.replied': '💬',
    'dm.sent': '✉️',
    'dm.replied': '💬',
    'conversion.meeting.booked': '📅',
    'conversion.purchase': '💰',
  };

  return <span className="text-lg">{iconMap[type] || '📍'}</span>;
}

function formatEventType(type: string): string {
  return type
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

