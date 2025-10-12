"use client";
import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: unknown) { console.error(e); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <div className="text-amber-300">Section failed to load.</div>;
    return this.props.children;
  }
}


