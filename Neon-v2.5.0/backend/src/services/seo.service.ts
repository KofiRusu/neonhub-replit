export async function audit({ url, notes }: { url?: string; notes?: string }) {
  if (!url) throw new Error("url required");
  const issues: string[] = [];
  if (!/https?:\/\//.test(url)) issues.push("Non-HTTP URL");
  const recs = ["Add meta description", "Ensure H1 present", "Compress hero images"];
  return { url, score: 78, issues, recommendations: recs, notes };
}



