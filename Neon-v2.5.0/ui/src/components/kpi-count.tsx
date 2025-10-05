"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function KpiCount({ value, format = "number", durationMs = 900 }: { value: number; format?: "number"|"currency"|"percentage"; durationMs?: number }) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (prefersReduced) { setDisplay(value); return; }
    const start = performance.now();
    const startVal = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + (value - startVal) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, durationMs, prefersReduced]);

  const fmt = (v: number) => {
    switch (format) {
      case "currency": return `$${Math.round(v).toLocaleString()}`;
      case "percentage": return `${v.toFixed(1)}%`;
      default: return Math.round(v).toLocaleString();
    }
  }
  return <span>{fmt(display)}</span>;
}


