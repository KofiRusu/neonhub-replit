/**
 * Utility Functions for Policy Console
 */

import type { ApiResponse, ApiErrorResponse } from '../../types/governance';

function isErrorResponse<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch wrapper with error handling
 */
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();

    if (isErrorResponse(data)) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString();
}

/**
 * Get status color for Tailwind classes
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    healthy: 'bg-green-500',
    active: 'bg-green-500',
    success: 'bg-green-500',
    degraded: 'bg-yellow-500',
    warning: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    error: 'bg-red-500',
    critical: 'bg-red-500',
    inactive: 'bg-gray-500',
    unknown: 'bg-gray-500',
  };

  return statusMap[status.toLowerCase()] || 'bg-gray-500';
}

/**
 * Get severity color for Tailwind classes
 */
export function getSeverityColor(severity: string): string {
  const severityMap: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };

  return severityMap[severity.toLowerCase()] || 'text-gray-600 bg-gray-50';
}

/**
 * Export data as JSON
 */
export function exportAsJSON<T>(data: T, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, filename);
}

/**
 * Export data as CSV
 */
export function exportAsCSV<T extends Record<string, unknown>>(data: T[], filename: string): void {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (typeof value === 'string') {
          return value.includes(',') ? `"${value}"` : value;
        }
        return value != null ? String(value) : '';
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Debounce function
 */
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait = 300
): (...args: Args) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate compliance score
 */
export function calculateComplianceScore(
  total: number,
  violations: number
): number {
  if (total === 0) return 100;
  return Math.max(0, Math.round(((total - violations) / total) * 100));
}

/**
 * Get health status indicator
 */
export function getHealthStatus(
  healthy: number,
  total: number
): 'healthy' | 'degraded' | 'critical' {
  const ratio = healthy / total;
  if (ratio >= 0.9) return 'healthy';
  if (ratio >= 0.5) return 'degraded';
  return 'critical';
}
