"use client";
import { useQuery } from "@tanstack/react-query";
import { getJSON } from "../lib/api";

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: () => getJSON<{ status: string }>("health") });
}


