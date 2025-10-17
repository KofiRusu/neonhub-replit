export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `/api/${path}`;
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// New: generic HTTP adapter that prefers NEXT_PUBLIC_API_URL when available.
// Falls back to Next.js API route namespace when API_BASE is empty.
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = (API_BASE || "").replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  const url = isAbsolute ? path : base ? `${base}/${normalizedPath}` : `/api/${normalizedPath}`;

  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  // Caller is responsible for correct T if not JSON
  return (await res.text()) as T;
}
