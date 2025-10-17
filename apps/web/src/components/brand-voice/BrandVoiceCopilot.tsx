"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Unused: import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE } from "@/src/lib/api";
import { Sparkles, Send, Clock } from "lucide-react";
import { useCopilotRouter, type Intent, type ActionResult } from "@/src/hooks/useCopilotRouter";
import AgentActionPicker from "@/src/components/brand-voice/AgentActionPicker";

type LogEntry = { intent: Intent; durationMs: number; ok: boolean };

const INTENT_KEYWORDS: { key: Intent; slash: string; hint: string }[] = [
  { key: "generate-post", slash: "/generate-post", hint: "Create long-form or social content" },
  { key: "seo-audit", slash: "/seo-audit", hint: "Run SEO audit for a URL" },
  { key: "email-seq", slash: "/email-seq", hint: "Draft a multi-step sequence" },
  { key: "support-reply", slash: "/support-reply", hint: "Draft support response" },
  { key: "trend-brief", slash: "/trend-brief", hint: "Summarize market trends" },
  { key: "analytics-summarize", slash: "/analytics-summarize", hint: "Executive summary of KPIs" },
];

function detectIntentFromText(text: string): Intent | undefined {
  const trimmed = text.trim();
  for (const i of INTENT_KEYWORDS) {
    if (trimmed.startsWith(i.slash)) return i.key;
  }
  return undefined;
}

export default function BrandVoiceCopilot() {
  const { mapIntentToCall } = useCopilotRouter();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [predicted, setPredicted] = useState<Intent | undefined>(undefined);
  const [lastResult, setLastResult] = useState<ActionResult | undefined>(undefined);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  const suggestions = useMemo(() => INTENT_KEYWORDS, []);

  function handleChange(next: string) {
    setInput(next);
    setPredicted(detectIntentFromText(next));
  }

  async function runIntent(intent: Intent, payload: Record<string, unknown>) {
    setPending(true);
    const started = performance.now();
    const res = await mapIntentToCall(intent, payload);
    const ended = performance.now();
    setPending(false);
    setLastResult(res);
    setLogs((l) => [{ intent, durationMs: Math.round(ended - started), ok: res.ok }, ...l].slice(0, 8));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const intent = detectIntentFromText(input);
    if (intent) {
      setPickerOpen(true);
      return;
    }
    // Free-text: keep as no-op for now; future: route to a default content generator
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {!API_BASE && (
        <div className="lg:col-span-3 text-sm text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-md p-3">
          Set <code className="font-mono">NEXT_PUBLIC_API_URL</code> in <code className="font-mono">.env.local</code> to enable backend calls. Using internal /api proxy otherwise.
        </div>
      )}
      <Card className="lg:col-span-2 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-neon-purple" /> Copilot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                placeholder="Type /seo-audit https://example.com or /generate-post ..."
                value={input}
                onChange={(e) => handleChange(e.target.value)}
              />
              <Button ref={submitBtnRef} type="submit" disabled={pending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="text-xs text-white/60">
              Try: {suggestions.map((s) => s.slash).join(" · ")}
            </div>

            {predicted && (
              <div className="text-sm text-neon-blue">
                Predicted intent: <span className="font-medium">{predicted}</span>
              </div>
            )}

            {lastResult && (
              <div className={`text-sm ${lastResult.ok ? "text-emerald-300" : "text-amber-300"}`}>
                {lastResult.ok ? "Success" : `Error: ${lastResult.error ?? "Unknown"}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Run</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" disabled={!predicted} className="w-full">Confirm Action</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Agent Action</DialogTitle>
                </DialogHeader>
                {predicted && (
                  <AgentActionPicker
                    intent={predicted}
                    rawInput={input}
                    onConfirm={async (payload) => {
                      setPickerOpen(false);
                      await runIntent(predicted, payload);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>

            <div className="space-y-2">
              <div className="text-xs text-white/60">Recent calls</div>
              <div className="space-y-1">
                {logs.length === 0 && <div className="text-xs text-white/40">No calls yet</div>}
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-white/70">
                    <div className="truncate">{l.intent}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {l.durationMs}ms
                      <span className={l.ok ? "text-emerald-400" : "text-amber-400"}>{l.ok ? "ok" : "fail"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


