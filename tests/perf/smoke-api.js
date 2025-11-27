import http from "k6/http";
import { check, sleep } from "k6";

const DEFAULT_BASE = "http://localhost:3001/api";
const DEFAULT_AUTH = "http://localhost:3000";

const BASE_URL = __ENV.API_BASE_URL || DEFAULT_BASE;
const AUTH_BASE_URL = __ENV.AUTH_BASE_URL || DEFAULT_AUTH;
const API_EMAIL = __ENV.API_EMAIL || "test@neonhub.local";
const API_PASSWORD = __ENV.API_PASSWORD || "TestPassword123!";

export const options = {
  vus: Number(__ENV.K6_VUS || 5),
  duration: __ENV.K6_DURATION || "2m",
  thresholds: {
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.99"],
  },
};

function login() {
  if (__ENV.API_BEARER_TOKEN) {
    return __ENV.API_BEARER_TOKEN;
  }
  const payload = JSON.stringify({ username: API_EMAIL, password: API_PASSWORD });
  const res = http.post(`${AUTH_BASE_URL}/api/auth/callback/credentials`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  check(res, {
    "login status": r => r.status === 200 || r.status === 201,
  });
  const body = res.json();
  const token = body?.token || body?.access_token;
  if (!token) {
    throw new Error("Unable to retrieve access token from auth provider");
  }
  return token;
}

export function setup() {
  return { token: login() };
}

export default function (data) {
  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health ok": r => r.status === 200 });

  const ready = http.get(`${BASE_URL}/readyz`);
  check(ready, { "readyz ok": r => r.status === 200 });

  const jobs = http.get(`${BASE_URL}/jobs`, params);
  check(jobs, { "jobs ok": r => r.status === 200 });

  const billing = http.get(`${BASE_URL}/billing/plan`, params);
  check(billing, { "billing ok": r => r.status === 200 });

  const connectors = http.get(`${BASE_URL}/connectors`, params);
  check(connectors, { "connectors ok": r => r.status === 200 });

  const metrics = http.get(`${BASE_URL}/metrics`, params);
  check(metrics, { "metrics ok": r => r.status === 200 });

  sleep(1);
}
