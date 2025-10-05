"use client";

import { Button } from "@/components/ui/button";
import { useId } from "react";

export default function PromptPresets({ onInsert }: { onInsert?: (text: string) => void }) {
  const id = useId();
  const items = [
    { label: "SEO Brief", text: "/seo-audit https://example.com" },
    { label: "30-day Social Plan", text: "/generate-post 30-day social plan for product launch" },
    { label: "Email Sequence", text: "/email-seq onboarding sequence for new signups" },
    { label: "Support Reply", text: "/support-reply handle refund request politely" },
    { label: "Trend Scan", text: "/trend-brief ai marketing trends this quarter" },
    { label: "Analytics Summary", text: "/analytics-summarize executive summary for last month" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {items.map((it, i) => (
        <Button key={`${id}-${i}`} variant="secondary" onClick={() => onInsert?.(it.text)}>
          {it.label}
        </Button>
      ))}
    </div>
  );
}


