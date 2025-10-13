import { spawn } from "node:child_process";
import http from "node:http";

function waitFor(url: string, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      http.get(url, res => {
        if (res.statusCode && res.statusCode < 500) return resolve();
        setTimeout(tick, 1500);
      }).on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error("Timeout"));
        else setTimeout(tick, 1500);
      });
    };
    tick();
  });
}

export async function runSmoke() {
  const api = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start:api"], { stdio: "ignore" });
  const web = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start:web"], { stdio: "ignore" });

  try {
    await waitFor("http://localhost:3001/health", 120000);
    await waitFor("http://localhost:3000", 120000);
  } finally {
    api.kill("SIGINT");
    web.kill("SIGINT");
  }
}

