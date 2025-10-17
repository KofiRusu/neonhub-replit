/**
 * Data Trust Viewer - Data Provenance and Integrity Visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { fetchAPI, formatDateTime } from './utils';
import type { ProvenanceEvent } from './types';

export interface DataTrustViewerProps {
  dataId?: string;
}

export function DataTrustViewer({ dataId = 'sample-data-001' }: DataTrustViewerProps) {
  const [provenance, setProvenance] = useState<ProvenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchAPI<{ history: ProvenanceEvent[] }>(
          `/api/data-trust/provenance/${dataId}`
        );
        setProvenance(result.history);
      } catch (err) {
        console.error('Failed to fetch provenance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataId]);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Data Provenance Tracker</h2>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Provenance Chain for {dataId}</h3>
        <div className="space-y-4">
          {provenance.map((event, _idx) => (
            <div key={event.eventId} className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>{event.eventType}</Badge>
                  <span className="text-sm text-gray-500">{formatDateTime(new Date(event.timestamp))}</span>
                </div>
                <p className="text-sm font-medium">{event.action} by {event.actor}</p>
                <p className="text-xs text-gray-500 mt-1">Hash: {event.hash.substring(0, 16)}...</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}