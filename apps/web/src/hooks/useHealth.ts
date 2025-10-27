"use client";
import { useQuery } from "@tanstack/react-query";
import { getJSON } from "../lib/api";

export interface HealthCheck {
  status: string;
  version?: string;
  checks?: {
    database?: {
      status: string;
      latency?: number;
    };
    websocket?: {
      status: string;
      connections?: number;
    };
    stripe?: {
      status: string;
    };
    openai?: {
      status: string;
    };
  };
  timestamp?: string;
  uptime?: number;
}

export function useHealth() {
  return useQuery({ 
    queryKey: ["health"], 
    queryFn: () => getJSON<HealthCheck>("health"),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}


