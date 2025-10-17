/**
 * Audit Log Viewer - Comprehensive Audit Log Exploration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { fetchAPI, formatDateTime, getSeverityColor, exportAsCSV, exportAsJSON } from './utils';
import type { AuditLogEntry } from './types';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: '', category: '', search: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const result = await fetchAPI<{ logs: AuditLogEntry[] }>('/api/governance/audit-logs');
      setLogs(result.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.category && log.category !== filter.category) return false;
    if (filter.search && !JSON.stringify(log).toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const handleExport = (format: 'json' | 'csv') => {
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'json') {
      exportAsJSON(filteredLogs, filename);
    } else {
      exportAsCSV(filteredLogs.map(log => ({
        timestamp: formatDateTime(new Date(log.timestamp)),
        level: log.level,
        category: log.category,
        action: log.action,
        userId: log.userId || 'N/A',
      })), filename);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Audit Log Viewer</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search logs..."
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
          />
          <select
            value={filter.level}
            onChange={e => setFilter({ ...filter, level: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filter.category}
            onChange={e => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="policy">Policy</option>
            <option value="data">Data</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="space-y-2">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <Badge className={getSeverityColor(log.level)}>{log.level.toUpperCase()}</Badge>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-xs text-gray-500">{log.category}</span>
                </div>
                <p className="text-sm text-gray-600">{formatDateTime(new Date(log.timestamp))}</p>
                {log.userId && <p className="text-xs text-gray-500 mt-1">User: {log.userId}</p>}
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <p className="text-center text-gray-500 py-8">No audit logs found matching your filters.</p>
        )}
      </Card>
    </div>
  );
}