"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BrandProfile } from "@/src/types/brand-voice";
import { http } from "@/src/lib/api";
import { r } from "@/src/lib/route-map";

type QueryState<T> = { data?: T; error?: string; loading: boolean };

export default function BrandMemoryPanel() {
  const [state, setState] = useState<QueryState<BrandProfile>>({ loading: true });

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        // GET /brand-voice/profile
        const data = await http<BrandProfile>(r("brandVoice_profile"));
        if (!mounted) return;
        setState({ loading: false, data, error: undefined });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (!mounted) return;
        if (/^404\s/i.test(message)) {
          setState({ loading: false, data: undefined, error: undefined });
        } else {
          setState({ loading: false, error: message });
        }
      }
    }
    void fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return <div className="text-sm text-white/60">Loading brand profile…</div>;
  }

  if (!state.data) {
    return (
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Connect Brand Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-white/70">
            No brand profile connected. TODO: Wire to <code>api.brandVoice.getProfile.query()</code> and display
            identity, tone, pillars, do/don’t, example phrases, personas, and value props.
          </div>
        </CardContent>
      </Card>
    );
  }

  const p = state.data;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white font-medium">{p.name}</div>
          <div className="text-white/70 text-sm mt-1">{p.mission}</div>
        </CardContent>
      </Card>
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Tone</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-white/80">
            {p.tone.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Pillars</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-white/80">
            {p.pillars.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Do & Don’t</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-white">Do</div>
              <ul className="list-disc pl-5 text-white/80">
                {p.dos.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-white">Don’t</div>
              <ul className="list-disc pl-5 text-white/80">
                {p.donts.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


