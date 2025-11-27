"use client";

import React from "react";
import { MigrationMonitor } from "@/components/MigrationMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHealth } from "@/hooks/useHealth";
import { RefreshCw, Database, Wifi, CheckCircle, XCircle } from "lucide-react";

/**
 * Deployment Dashboard
 * 
 * Real-time monitoring for database migrations, deployments, and system health
 */
export default function DeploymentPage() {
  const { data: health, isLoading, refetch } = useHealth();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Deployment Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Monitor database migrations and system health in real-time
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            {health?.status === "healthy" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{health?.status || "Unknown"}</div>
            <p className="text-xs text-gray-400">
              Version {health?.version || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  health?.checks?.database?.status === "ok" ? "default" : "destructive"
                }
              >
                {health?.checks?.database?.status || "unknown"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {health?.checks?.database?.latency
                ? `${health.checks.database.latency}ms latency`
                : "No latency data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
            <Wifi className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  health?.checks?.websocket?.status === "ok" ? "default" : "destructive"
                }
              >
                {health?.checks?.websocket?.status || "unknown"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {health?.checks?.websocket?.connections !== undefined
                ? `${health.checks.websocket.connections} active connections`
                : "No connection data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.uptime ? `${Math.floor(health.uptime / 60 / 60)}h` : "N/A"}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {health?.uptime ? `${Math.floor(health.uptime)} seconds` : "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Migration Monitor */}
      <MigrationMonitor />

      {/* Additional Service Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>External Services</CardTitle>
            <CardDescription>Status of third-party integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stripe</span>
              <Badge
                variant={
                  health?.checks?.stripe?.status === "ok"
                    ? "default"
                    : health?.checks?.stripe?.status === "not_configured"
                      ? "secondary"
                      : "destructive"
                }
              >
                {health?.checks?.stripe?.status || "unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">OpenAI</span>
              <Badge
                variant={
                  health?.checks?.openai?.status === "ok"
                    ? "default"
                    : health?.checks?.openai?.status === "not_configured"
                      ? "secondary"
                      : "destructive"
                }
              >
                {health?.checks?.openai?.status || "unknown"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deployment Information</CardTitle>
            <CardDescription>Current deployment metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant="secondary">{process.env.NODE_ENV || "development"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Health Check</span>
              <span className="text-sm text-gray-400">
                {health?.timestamp
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm font-mono">{health?.version || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common deployment and maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            View Logs
          </Button>
          <Button variant="outline" size="sm">
            Database Schema
          </Button>
          <Button variant="outline" size="sm">
            Migration History
          </Button>
          <Button variant="outline" size="sm">
            Drift Detection
          </Button>
          <Button variant="outline" size="sm" disabled>
            Rollback (Disabled)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
