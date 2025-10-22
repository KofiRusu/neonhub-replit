"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create Socket.IO connection
 * Returns null on server-side to prevent issues with SSR
 */
export function getSocket(): Socket | null {
  // Don't create socket on server
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing socket if connected
  if (socket && socket.connected) {
    return socket;
  }

  // Create new socket connection
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
  
  socket = io(apiUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ Socket.IO connected");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket.IO disconnected");
  });

  socket.on("connect_error", (error) => {
    console.warn("Socket.IO connection error:", error.message);
  });

  return socket;
}

/**
 * Subscribe to an event
 */
export function subscribe<T = unknown>(event: string, callback: (payload: T) => void): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  socket.on(event, (payload: T) => callback(payload));

  // Return unsubscribe function
  return () => {
    socket.off(event, callback);
  };
}

/**
 * Emit an event
 */
export function emit<T>(event: string, data: T): void {
  const socket = getSocket();
  if (!socket) return;

  socket.emit(event, data);
}

/**
 * Disconnect socket
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
