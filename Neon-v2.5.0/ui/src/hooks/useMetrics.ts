"use client";
import { useQuery } from "@tanstack/react-query";
import { getJSON } from "../lib/api";

export type KPIs = { revenue: number; agents: number; conversion: number; efficiency: number };

export function useMetrics() {
  return useQuery({ queryKey: ["kpis"], queryFn: () => getJSON<KPIs>("metrics/summary") });
}


