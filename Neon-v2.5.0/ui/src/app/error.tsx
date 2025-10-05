"use client";
import { useEffect } from "react";
import Link from "next/link";
import NeonCard from "@/components/neon-card";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html><body>
      <div className="mx-auto max-w-3xl p-6">
        <NeonCard className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-white/70">We hit a snag. Try again or return to the dashboard.</p>
          <Link href="/dashboard" className="inline-flex items-center rounded-lg px-4 py-2 bg-white/10 hover:bg-white/20 transition">
            Back to Dashboard
          </Link>
        </NeonCard>
      </div>
    </body></html>
  );
}


