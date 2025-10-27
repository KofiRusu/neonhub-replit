import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "../lib/logger.js";

let io: SocketIOServer | null = null;

export function initWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://127.0.0.1:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Client connected");

    // Subscribe to campaign updates
    socket.on("subscribe:campaign", (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      logger.debug({ socketId: socket.id, campaignId }, "Subscribed to campaign");
    });

    socket.on("unsubscribe:campaign", (campaignId: string) => {
      socket.leave(`campaign:${campaignId}`);
      logger.debug({ socketId: socket.id, campaignId }, "Unsubscribed from campaign");
    });

    // Migration monitoring subscriptions
    socket.on("subscribe:migration", () => {
      socket.join("migration");
      socket.emit("migration:status", { phase: "ready", timestamp: new Date() });
      logger.debug({ socketId: socket.id }, "Subscribed to migration updates");
    });

    socket.on("unsubscribe:migration", () => {
      socket.leave("migration");
      logger.debug({ socketId: socket.id }, "Unsubscribed from migration updates");
    });

    // Real-time metrics subscription
    socket.on("subscribe:metrics", () => {
      socket.join("metrics");
      logger.debug({ socketId: socket.id }, "Subscribed to metrics");
    });

    socket.on("unsubscribe:metrics", () => {
      socket.leave("metrics");
      logger.debug({ socketId: socket.id }, "Unsubscribed from metrics");
    });

    // Deployment monitoring subscription
    socket.on("subscribe:deployment", () => {
      socket.join("deployment");
      socket.emit("deployment:status", { status: "ready", timestamp: new Date() });
      logger.debug({ socketId: socket.id }, "Subscribed to deployment updates");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket not initialized. Call initWebSocket first.");
  }
  return io;
}

export function broadcast(event: string, data: any): void {
  try {
    const socket = getIO();
    socket.emit(event, data);
    logger.debug({ event, data }, "Broadcast event");
  } catch (error) {
    logger.error({ error, event }, "Failed to broadcast event");
  }
}

export function broadcastToCampaign(campaignId: string, event: string, data: any): void {
  try {
    const socket = getIO();
    socket.to(`campaign:${campaignId}`).emit(event, data);
    logger.debug({ campaignId, event, data }, "Broadcast to campaign");
  } catch (error) {
    logger.error({ error, campaignId, event }, "Failed to broadcast to campaign");
  }
}

// Broadcast migration events to subscribed clients
export function broadcastMigration(event: string, data: any): void {
  try {
    const socket = getIO();
    socket.to("migration").emit(event, {
      ...data,
      timestamp: new Date(),
    });
    logger.info({ event, data }, "Migration event broadcast");
  } catch (error) {
    logger.error({ error, event }, "Failed to broadcast migration event");
  }
}

// Broadcast metrics to subscribed clients
export function broadcastMetrics(data: any): void {
  try {
    const socket = getIO();
    socket.to("metrics").emit("metrics:update", {
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error({ error }, "Failed to broadcast metrics");
  }
}

// Broadcast deployment events
export function broadcastDeployment(event: string, data: any): void {
  try {
    const socket = getIO();
    socket.to("deployment").emit(event, {
      ...data,
      timestamp: new Date(),
    });
    logger.info({ event, data }, "Deployment event broadcast");
  } catch (error) {
    logger.error({ error, event }, "Failed to broadcast deployment event");
  }
}
