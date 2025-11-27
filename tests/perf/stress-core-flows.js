import http from "k6/http";
import { check, sleep } from "k6";

const DEFAULT_BASE = "http://localhost:3001/api";
const DEFAULT_AUTH = "http://localhost:3000";

const BASE_URL = __ENV.API_BASE_URL || DEFAULT_BASE;
const AUTH_BASE_URL = __ENV.AUTH_BASE_URL || DEFAULT_AUTH;
const API_EMAIL = __ENV.API_EMAIL || "test@neonhub.local";
const API_PASSWORD = __ENV.API_PASSWORD || "TestPassword123!";

export const options = {
  stages: [
    { duration: "1m", target: Number(__ENV.K6_STAGE_VUS_STAGE1 || 5) },
    { duration: "2m", target: Number(__ENV.K6_STAGE_VUS_STAGE2 || 15) },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1200"],
    checks: ["rate>0.98"],
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
  check(res, { "login status": r => r.status === 200 || r.status === 201 });
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

function authParams(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

function extractId(res) {
  const json = res.json();
  const entity = json?.data || json;
  return entity?.id;
}

export default function (data) {
  const params = authParams(data.token);
  const campaignName = `PerfFlow-${Date.now()}-${__ITER}`;

  const campaignRes = http.post(
    `${BASE_URL}/campaigns`,
    JSON.stringify({
      name: campaignName,
      type: "multi-channel",
      config: {
        channels: ["email", "social"],
        budget: { total: 500 + Math.random() * 200, currency: "USD" },
      },
    }),
    params,
  );

  check(campaignRes, { "campaign created": r => r.status === 201 });
  const campaignId = extractId(campaignRes);
  if (!campaignId) {
    return;
  }

  const emailRes = http.post(
    `${BASE_URL}/campaigns/${campaignId}/email/sequence`,
    JSON.stringify({
      topic: `${campaignName} nurture`,
      audience: "stress-suite",
      numEmails: 2,
      tone: "professional",
    }),
    params,
  );
  check(emailRes, { "email sequence ok": r => r.status === 200 });

  const socialRes = http.post(
    `${BASE_URL}/campaigns/${campaignId}/social/schedule`,
    JSON.stringify({
      platform: "linkedin",
      content: "Load testing social schedule",
      scheduledFor: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    params,
  );
  check(socialRes, { "social schedule ok": r => r.status === 200 });

  const analyticsRes = http.get(`${BASE_URL}/campaigns/${campaignId}/analytics`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(analyticsRes, { "analytics ok": r => r.status === 200 });

  http.del(`${BASE_URL}/campaigns/${campaignId}`, null, {
    headers: { Authorization: `Bearer ${data.token}` },
  });

  sleep(0.5);
}
