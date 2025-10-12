"use client";
import React from "react";

export default function DebugStatus() {
  const [status, setStatus] = React.useState<"ready" | "online" | "offline">("ready");
  React.useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return; // optional
    const url = base.replace(/\/$/, "") + "/health";
    fetch(url, { cache: "no-store" })
      .then((r) => setStatus(r.ok ? "online" : "offline"))
      .catch(() => setStatus("offline"));
  }, []);
  return (
    <div className="text-xs text-white/70">
      UI Ready{status !== "ready" && ` • API ${status}`}
    </div>
  );
}


