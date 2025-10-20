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
