"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Intent } from "@/src/types/brand-voice";

export default function AgentActionPicker({
  intent,
  rawInput,
  onConfirm,
}: {
  intent: Intent;
  rawInput: string;
  onConfirm: (payload: Record<string, unknown>) => void | Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");

  const payload = useMemo(() => {
    switch (intent) {
      case "seo-audit":
        return { url, notes };
      case "generate-post":
        return { topic: topic || rawInput.replace(/^\/generate-post\s*/, ""), audience, notes };
      case "email-seq":
        return { topic: topic || rawInput.replace(/^\/email-seq\s*/, ""), audience, notes };
      case "support-reply":
        return { notes: notes || rawInput.replace(/^\/support-reply\s*/, "") };
      case "trend-brief":
      case "analytics-summarize":
        return { notes: notes || rawInput.replace(/^\/(trend-brief|analytics-summarize)\s*/, "") };
      default:
        return { notes } as const;
    }
  }, [intent, url, topic, audience, notes, rawInput]);

  return (
    <div className="space-y-3">
      {intent === "seo-audit" && (
        <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
      )}
      {(intent === "generate-post" || intent === "email-seq") && (
        <>
          <Input placeholder="Topic or subject" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Input placeholder="Audience (e.g., SMB marketers)" value={audience} onChange={(e) => setAudience(e.target.value)} />
        </>
      )}
      <Textarea placeholder="Notes or constraints" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button onClick={() => onConfirm(payload)}>Run</Button>
      </div>
    </div>
  );
}


