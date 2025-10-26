"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface MigrationPhase {
  name: string;
  description?: string;
  status: "pending" | "running" | "complete" | "failed" | "skipped";
  duration: number;
  error?: string;
  timestamp?: Date;
}

export interface MigrationStatus {
  isActive: boolean;
  currentPhase?: string;
  phases: MigrationPhase[];
  totalPhases?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface DeploymentStatus {
  status: "idle" | "deploying" | "success" | "failed";
  message?: string;
  timestamp?: Date;
}

export interface UseMigrationStatusReturn {
  socket: Socket | null;
  isConnected: boolean;
  migrationStatus: MigrationStatus;
  deploymentStatus: DeploymentStatus;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Hook to monitor database migration status via WebSocket
 * 
 * @example
 * ```tsx
 * const { isConnected, migrationStatus, deploymentStatus } = useMigrationStatus();
 * 
 * if (migrationStatus.isActive) {
 *   return <MigrationProgress phases={migrationStatus.phases} />;
 * }
 * ```
 */
export function useMigrationStatus(): UseMigrationStatusReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    isActive: false,
    phases: [],
  });
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: "idle",
  });

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

    const newSocket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"],
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("[Migration Monitor] Connected to WebSocket");
      setIsConnected(true);

      // Subscribe to migration and deployment updates
      newSocket.emit("subscribe:migration");
      newSocket.emit("subscribe:deployment");
    });

    newSocket.on("disconnect", () => {
      console.log("[Migration Monitor] Disconnected from WebSocket");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Migration Monitor] Connection error:", error);
      setIsConnected(false);
    });

    // Migration events
    newSocket.on("migration:status", (data: any) => {
      console.log("[Migration Monitor] Status update:", data);
      setMigrationStatus(prev => ({
        ...prev,
        currentPhase: data.phase,
      }));
    });

    newSocket.on("migration:started", (data: any) => {
      console.log("[Migration Monitor] Migration started:", data);
      setMigrationStatus({
        isActive: true,
        phases: data.phases?.map((p: any) => ({
          name: p.name,
          description: p.description,
          status: "pending" as const,
          duration: 0,
        })) || [],
        totalPhases: data.totalPhases,
        startedAt: new Date(),
      });
    });

    newSocket.on("migration:phase:start", (data: any) => {
      console.log("[Migration Monitor] Phase started:", data);
      setMigrationStatus(prev => ({
        ...prev,
        currentPhase: data.phase,
        phases: prev.phases.map(p =>
          p.name === data.phase
            ? { ...p, status: "running" as const, timestamp: new Date() }
            : p
        ),
      }));
    });

    newSocket.on("migration:phase:complete", (data: any) => {
      console.log("[Migration Monitor] Phase completed:", data);
      setMigrationStatus(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.name === data.phase
            ? { ...p, status: "complete" as const, duration: data.duration || 0 }
            : p
        ),
      }));
    });

    newSocket.on("migration:phase:failed", (data: any) => {
      console.log("[Migration Monitor] Phase failed:", data);
      setMigrationStatus(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.name === data.phase
            ? {
                ...p,
                status: "failed" as const,
                duration: data.duration || 0,
                error: data.error,
              }
            : p
        ),
        error: data.error,
      }));
    });

    newSocket.on("migration:phase:skipped", (data: any) => {
      console.log("[Migration Monitor] Phase skipped:", data);
      setMigrationStatus(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.name === data.phase
            ? { ...p, status: "skipped" as const, duration: data.duration || 0 }
            : p
        ),
      }));
    });

    newSocket.on("migration:completed", (data: any) => {
      console.log("[Migration Monitor] Migration completed:", data);
      setMigrationStatus(prev => ({
        ...prev,
        isActive: false,
        completedAt: new Date(),
      }));
    });

    newSocket.on("migration:failed", (data: any) => {
      console.log("[Migration Monitor] Migration failed:", data);
      setMigrationStatus(prev => ({
        ...prev,
        isActive: false,
        completedAt: new Date(),
        error: data.error || "Migration failed",
      }));
    });

    // Deployment events
    newSocket.on("deployment:status", (data: any) => {
      console.log("[Deployment Monitor] Status update:", data);
      setDeploymentStatus({
        status: data.status,
        message: data.message,
        timestamp: new Date(data.timestamp),
      });
    });

    // Drift detection events
    newSocket.on("drift:detected", (data: any) => {
      console.warn("[Migration Monitor] Schema drift detected:", data);
      // Could trigger a notification or alert
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribe:migration");
      socketRef.current.emit("unsubscribe:deployment");
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket,
    isConnected,
    migrationStatus,
    deploymentStatus,
    reconnect,
    disconnect,
  };
}

