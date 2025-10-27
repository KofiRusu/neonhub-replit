"use client";

import React from "react";
import { useMigrationStatus } from "@/hooks/useMigrationStatus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MigrationMonitorProps {
  className?: string;
  compact?: boolean;
}

/**
 * Real-time database migration monitoring dashboard
 * 
 * Displays live migration progress with WebSocket updates
 * 
 * @example
 * ```tsx
 * <MigrationMonitor />
 * ```
 */
export function MigrationMonitor({ className, compact = false }: MigrationMonitorProps) {
  const { isConnected, migrationStatus, deploymentStatus } = useMigrationStatus();

  const completedPhases = migrationStatus.phases.filter(
    p => p.status === "complete" || p.status === "skipped"
  ).length;
  const totalPhases = migrationStatus.phases.length;
  const progressPercent = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  const failedPhase = migrationStatus.phases.find(p => p.status === "failed");

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Database Migration Monitor
            </CardTitle>
            {!compact && (
              <CardDescription className="mt-1">
                Real-time deployment and schema migration tracking
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {deploymentStatus.status !== "idle" && (
              <Badge
                variant={
                  deploymentStatus.status === "success"
                    ? "default"
                    : deploymentStatus.status === "failed"
                      ? "destructive"
                      : "secondary"
                }
              >
                {deploymentStatus.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Migration Progress */}
        {migrationStatus.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Migration Progress</span>
              <span className="text-muted-foreground">
                {completedPhases} / {totalPhases} phases
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Error Alert */}
        {failedPhase && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  Migration Failed: {failedPhase.name}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {failedPhase.error || "An unknown error occurred"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase List */}
        <div className="space-y-3">
          {migrationStatus.phases.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? "Waiting for migration to start..."
                  : "Connecting to monitoring service..."}
              </p>
            </div>
          ) : (
            migrationStatus.phases.map((phase, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  phase.status === "running" &&
                    "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
                  phase.status === "complete" &&
                    "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
                  phase.status === "failed" &&
                    "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                  phase.status === "skipped" &&
                    "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800",
                  phase.status === "pending" && "border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="flex-shrink-0">
                  {phase.status === "running" && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  )}
                  {phase.status === "complete" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {phase.status === "failed" && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  {phase.status === "skipped" && (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {phase.status === "pending" && (
                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        "font-medium capitalize",
                        phase.status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {phase.name.replace(/_/g, " ")}
                    </h4>
                    {phase.duration > 0 && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {(phase.duration / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                  {phase.description && !compact && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {phase.description}
                    </p>
                  )}
                  {phase.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {phase.error}
                    </p>
                  )}
                </div>

                <Badge
                  variant={
                    phase.status === "complete"
                      ? "default"
                      : phase.status === "failed"
                        ? "destructive"
                        : phase.status === "running"
                          ? "secondary"
                          : "outline"
                  }
                  className="flex-shrink-0"
                >
                  {phase.status}
                </Badge>
              </div>
            ))
          )}
        </div>

        {/* Migration Summary */}
        {migrationStatus.completedAt && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed at:</span>
              <span className="font-medium">
                {migrationStatus.completedAt.toLocaleTimeString()}
              </span>
            </div>
            {migrationStatus.startedAt && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Total duration:</span>
                <span className="font-medium">
                  {(
                    (migrationStatus.completedAt.getTime() -
                      migrationStatus.startedAt.getTime()) /
                    1000
                  ).toFixed(2)}
                  s
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact variant for embedding in dashboards
 */
export function MigrationMonitorCompact() {
  return <MigrationMonitor compact className="max-w-md" />;
}

