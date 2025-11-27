#!/usr/bin/env node

import fs from "fs";
import path from "path";

const COLLECTION_PATH = path.join(process.cwd(), "postman/NeonHub-API.postman_collection.json");

const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, "utf8"));

const bearerAuth = {
  type: "bearer",
  bearer: [
    {
      key: "token",
      value: "{{access_token}}",
      type: "string",
    },
  ],
};

const jsonHeader = [{ key: "Content-Type", value: "application/json" }];

const ensureFolder = name => {
  let folder = collection.item.find(entry => entry.name === name);
  if (!folder) {
    folder = { name, item: [] };
    collection.item.push(folder);
  }
  if (!Array.isArray(folder.item)) {
    folder.item = [];
  }
  return folder;
};

const pathToRaw = segments => {
  const joined = segments.join("/");
  return joined ? `{{base_url}}/${joined}` : "{{base_url}}";
};

const buildUrl = segments => ({
  raw: pathToRaw(segments),
  host: ["{{base_url}}"],
  path: segments,
});

const buildTests = ({ successCodes = [200], assertions = [] }) => {
  const tests = [];
  tests.push(
    `pm.test('Status code is ${successCodes.join("/")}', function() { pm.expect(${JSON.stringify(successCodes)}).to.include(pm.response.code); });`,
  );
  tests.push(
    "pm.test('Response time < 1000 ms', function() { pm.expect(pm.response.responseTime).to.be.below(1000); });",
  );
  return [...tests, ...assertions];
};

const createRequest = ({
  name,
  method,
  segments,
  body,
  auth = true,
  tests,
  headers,
  description,
}) => {
  const request = {
    name,
    request: {
      method,
      url: buildUrl(segments),
    },
  };
  if (description) {
    request.request.description = description;
  }
  if (auth) {
    request.request.auth = JSON.parse(JSON.stringify(bearerAuth));
  }
  if (body !== undefined) {
    request.request.body = {
      mode: "raw",
      raw: typeof body === "string" ? body : JSON.stringify(body),
    };
    request.request.header = headers ?? jsonHeader;
  } else if (headers) {
    request.request.header = headers;
  }
  if (tests && tests.length) {
    request.event = [
      {
        listen: "test",
        script: {
          exec: tests,
        },
      },
    ];
  }
  return request;
};

const upsertRequest = (folderName, request) => {
  const folder = ensureFolder(folderName);
  folder.item = folder.item.filter(item => item.name !== request.name);
  folder.item.push(request);
};

const nowPlus = offsetDays => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const campaignRequests = [
  createRequest({
    name: "PUT /campaigns/:id (Update)",
    method: "PUT",
    segments: ["campaigns", "{{campaign_id}}"],
    body: {
      name: "Updated API Campaign",
      status: "active",
      config: {
        channels: ["email", "social"],
        budget: {
          total: 2500,
          currency: "USD",
        },
      },
      schedule: {
        startDate: "{{campaign_start_date}}",
        endDate: "{{campaign_end_date}}",
        timezone: "UTC",
      },
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload.result || payload;",
        "pm.expect(entity).to.be.an('object');",
        "if (payload.success !== undefined) { pm.expect(payload.success).to.be.true; }",
      ],
    }),
  }),
  createRequest({
    name: "POST /campaigns/:id/schedule",
    method: "POST",
    segments: ["campaigns", "{{campaign_id}}", "schedule"],
    body: {
      startDate: "{{campaign_start_date}}",
      endDate: "{{campaign_end_date}}",
      emailSequence: [
        {
          day: 1,
          subject: "Kickoff update",
          body: "Intro email generated via Postman automation.",
        },
      ],
      socialPosts: [
        {
          platform: "linkedin",
          content: "Announcing our automated growth campaign.",
          scheduledFor: "{{campaign_social_date}}",
        },
      ],
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "PATCH /campaigns/:id/status",
    method: "PATCH",
    segments: ["campaigns", "{{campaign_id}}", "status"],
    body: {
      status: "paused",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload;",
        "pm.expect(entity).to.have.property('status');",
      ],
    }),
  }),
  createRequest({
    name: "POST /campaigns/:id/email/sequence",
    method: "POST",
    segments: ["campaigns", "{{campaign_id}}", "email", "sequence"],
    body: {
      topic: "Lifecycle onboarding",
      audience: "beta-users",
      numEmails: 3,
      tone: "friendly",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload;",
        "pm.expect(entity).to.have.property('success');",
      ],
    }),
  }),
  createRequest({
    name: "POST /campaigns/:id/social/schedule",
    method: "POST",
    segments: ["campaigns", "{{campaign_id}}", "social", "schedule"],
    body: {
      platform: "twitter",
      content: "Scheduling our social promotion via automation.",
      mediaUrls: ["https://neonhub.ai/assets/promo.png"],
      scheduledFor: "{{campaign_social_date}}",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /campaigns/:id/ab-test",
    method: "POST",
    segments: ["campaigns", "{{campaign_id}}", "ab-test"],
    body: {
      variants: [
        { subject: "Subject A", body: "Variant A body" },
        { subject: "Subject B", body: "Variant B body" },
      ],
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "DELETE /campaigns/:id (Cleanup)",
    method: "DELETE",
    segments: ["campaigns", "{{campaign_id}}"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('message');",
      ],
    }),
  }),
  createRequest({
    name: "POST /campaigns (Negative – missing body)",
    method: "POST",
    segments: ["campaigns"],
    body: {},
    tests: buildTests({
      successCodes: [400],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('error');",
      ],
    }),
  }),
];

const billingRequests = [
  createRequest({
    name: "GET /billing/plan",
    method: "GET",
    segments: ["billing", "plan"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('plan');",
      ],
    }),
  }),
  createRequest({
    name: "GET /billing/usage",
    method: "GET",
    segments: ["billing", "usage"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('usage').or.property('data');",
      ],
    }),
  }),
  createRequest({
    name: "POST /billing/checkout (Plan upgrade)",
    method: "POST",
    segments: ["billing", "checkout"],
    body: {
      plan: "pro",
      successUrl: "{{billing_success_url}}",
      cancelUrl: "{{billing_cancel_url}}",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /billing/portal",
    method: "POST",
    segments: ["billing", "portal"],
    body: {
      returnUrl: "{{billing_return_url}}",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /billing/checkout (Negative – no plan)",
    method: "POST",
    segments: ["billing", "checkout"],
    body: {
      successUrl: "{{billing_success_url}}",
      cancelUrl: "{{billing_cancel_url}}",
    },
    tests: buildTests({
      successCodes: [400],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('error');",
      ],
    }),
  }),
];

const taskRequests = [
  createRequest({
    name: "POST /tasks (Create)",
    method: "POST",
    segments: ["tasks"],
    body: {
      title: "Agent coverage task",
      description: "Ensure tasks API works end-to-end",
      priority: "medium",
      dueDate: nowPlus(3),
      tags: ["api", "regression"],
    },
    tests: buildTests({
      successCodes: [201],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload;",
        "pm.expect(entity).to.have.property('id');",
        "pm.environment.set('task_id', entity.id);",
      ],
    }),
  }),
  createRequest({
    name: "GET /tasks (List)",
    method: "GET",
    segments: ["tasks"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "PUT /tasks/:id (Update status)",
    method: "PUT",
    segments: ["tasks", "{{task_id}}"],
    body: {
      status: "in_progress",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload;",
        "pm.expect(entity).to.have.property('status');",
      ],
    }),
  }),
  createRequest({
    name: "DELETE /tasks/:id",
    method: "DELETE",
    segments: ["tasks", "{{task_id}}"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "PUT /tasks/:id (Negative – invalid status)",
    method: "PUT",
    segments: ["tasks", "{{task_id}}"],
    body: {
      status: "invalid-status",
    },
    tests: buildTests({
      successCodes: [400],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('error');",
      ],
    }),
  }),
];

const teamRequests = [
  createRequest({
    name: "GET /team/members",
    method: "GET",
    segments: ["team", "team", "members"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success');",
      ],
    }),
  }),
  createRequest({
    name: "POST /team/invite",
    method: "POST",
    segments: ["team", "team", "invite"],
    body: {
      email: "qa+" + Date.now() + "@neonhub.test",
      role: "Member",
      message: "API invite from automated suite",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "const entity = payload.data || payload;",
        "pm.expect(entity).to.have.property('id');",
        "pm.environment.set('team_invitation_id', entity.id);",
      ],
    }),
  }),
  createRequest({
    name: "GET /team/invitations",
    method: "GET",
    segments: ["team", "team", "invitations"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success');",
      ],
    }),
  }),
  createRequest({
    name: "DELETE /team/invitations/:id",
    method: "DELETE",
    segments: ["team", "team", "invitations", "{{team_invitation_id}}"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /team/invite (Negative – invalid email)",
    method: "POST",
    segments: ["team", "team", "invite"],
    body: {
      email: "invalid-email",
      role: "Admin",
    },
    tests: buildTests({
      successCodes: [400],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('error');",
      ],
    }),
  }),
];

const governanceRequests = [
  createRequest({
    name: "POST /governance/ethics/assess",
    method: "POST",
    segments: ["governance", "ethics", "assess"],
    body: {
      scenario: "Automated outreach",
      region: "us",
      dataClasses: ["pii", "behavioral"],
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /governance/evaluate",
    method: "POST",
    segments: ["governance", "evaluate"],
    body: {
      policy: "marketing",
      inputs: {
        audience: "enterprise",
        sensitivity: "high",
      },
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /data-trust/audit/log",
    method: "POST",
    segments: ["data-trust", "audit", "log"],
    body: {
      action: "api-test",
      actor: "postman-suite",
      metadata: {
        requestId: "pm-" + Date.now(),
      },
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "GET /data-trust/audit/logs",
    method: "GET",
    segments: ["data-trust", "audit", "logs"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success');",
      ],
    }),
  }),
  createRequest({
    name: "POST /data-trust/hash",
    method: "POST",
    segments: ["data-trust", "hash"],
    body: {
      payload: "hash me",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
];

const connectorRequests = [
  createRequest({
    name: "POST /connectors/:name/api-key",
    method: "POST",
    segments: ["connectors", "{{connector_slug}}", "api-key"],
    body: {
      apiKey: "test-api-key",
      apiSecret: "test-secret",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "GET /connectors/:name/auth",
    method: "GET",
    segments: ["connectors", "{{connector_slug}}", "auth"],
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success');",
      ],
    }),
  }),
  createRequest({
    name: "DELETE /connectors/:name/auth/:id",
    method: "DELETE",
    segments: ["connectors", "{{connector_slug}}", "auth", "{{connector_auth_id}}"],
    tests: buildTests({
      successCodes: [200, 204],
      assertions: [
        "pm.test('Connector auth cleanup acknowledged', function() { pm.expect([200,204]).to.include(pm.response.code); });",
      ],
    }),
  }),
];

const settingsRequests = [
  createRequest({
    name: "PUT /settings (Update profile)",
    method: "PUT",
    segments: ["settings"],
    body: {
      brandVoice: {
        tone: "trusted-advisor",
      },
      timezone: "UTC",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('settings');",
      ],
    }),
  }),
  createRequest({
    name: "PUT /settings/notifications",
    method: "PUT",
    segments: ["settings", "notifications"],
    body: {
      emailNotifications: true,
      pushNotifications: false,
      notificationFrequency: "daily",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('emailNotifications');",
      ],
    }),
  }),
];

const smsSocialRequests = [
  createRequest({
    name: "POST /sms/send",
    method: "POST",
    segments: ["sms", "send"],
    body: {
      personId: "{{sms_person_id}}",
      objective: "Nudge opt-in",
      brandId: "{{sms_brand_id}}",
    },
    tests: buildTests({
      successCodes: [202],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('body');",
      ],
    }),
  }),
  createRequest({
    name: "POST /sms/inbound (Webhook simulation)",
    method: "POST",
    segments: ["sms", "inbound"],
    body: {
      From: "+15551234567",
      Body: "reply STOP",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
  createRequest({
    name: "POST /social/:platform/dm",
    method: "POST",
    segments: ["social", "linkedin", "dm"],
    body: {
      recipientHandle: "cmo.neonhub",
      message: "Testing direct message automation.",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
];

const metricsRequests = [
  createRequest({
    name: "GET /metrics (Prometheus scrape)",
    method: "GET",
    segments: ["metrics"],
    auth: false,
    tests: [
      "pm.test('Status code is 200', function() { pm.response.to.have.status(200); });",
      "pm.test('Metrics payload present', function() { pm.expect(pm.response.text()).to.include('http_requests_total'); });",
    ],
  }),
  createRequest({
    name: "POST /metrics/events",
    method: "POST",
    segments: ["metrics", "events"],
    body: {
      name: "api.test",
      value: 1,
      tags: {
        suite: "postman",
      },
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
];

const sitemapRequests = [
  createRequest({
    name: "GET /sitemap.xml",
    method: "GET",
    segments: ["sitemap.xml"],
    auth: false,
    tests: [
      "pm.test('Status code is 200', function() { pm.response.to.have.status(200); });",
      "pm.test('XML payload returned', function() { pm.expect(pm.response.text()).to.contain('<?xml'); });",
    ],
  }),
  createRequest({
    name: "POST /sitemap/invalidate",
    method: "POST",
    segments: ["sitemap", "invalidate"],
    body: {
      path: "/campaigns",
    },
    tests: buildTests({
      successCodes: [200],
      assertions: [
        "const payload = pm.response.json();",
        "pm.expect(payload).to.have.property('success').that.is.true;",
      ],
    }),
  }),
];

const multiAgentFlow = {
  name: "E2E – Multi-Agent Flow",
  item: [
    {
      name: "0. Login (Multi-agent flow)",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              "pm.test('Login successful', function() { pm.expect([200,201]).to.include(pm.response.code); });",
              "const response = pm.response.json();",
              "const token = response.token || response.access_token;",
              "pm.environment.set('access_token', token);",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        url: {
          raw: "{{auth_base_url}}/api/auth/callback/credentials",
          host: ["{{auth_base_url}}"],
          path: ["api", "auth", "callback", "credentials"],
        },
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: '{"username": "{{email}}", "password": "{{password}}"}',
        },
      },
    },
    {
      name: "1. TrendAgent – Generate brief",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              ...buildTests({ successCodes: [200] }),
              "const payload = pm.response.json();",
              "const entity = payload.data || payload;",
              "const firstTopic = (entity.topics && entity.topics[0]?.title) || entity.brief?.[0]?.title || 'retention boosters';",
              "pm.environment.set('latest_trend_topic', firstTopic);",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        auth: JSON.parse(JSON.stringify(bearerAuth)),
        url: buildUrl(["trends", "trends", "brief"]),
        header: jsonHeader,
        body: {
          mode: "raw",
          raw: JSON.stringify({
            notes: "Find retention opportunities",
            platforms: ["twitter"],
          }),
        },
      },
    },
    {
      name: "2. ContentAgent – Generate asset",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              ...buildTests({ successCodes: [200] }),
              "const payload = pm.response.json();",
              "const entity = payload.data || payload;",
              "const title = entity.title || entity.topic || pm.environment.get('latest_trend_topic');",
              "pm.environment.set('latest_content_title', title);",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        auth: JSON.parse(JSON.stringify(bearerAuth)),
        url: buildUrl(["content", "generate"]),
        header: jsonHeader,
        body: {
          mode: "raw",
          raw: JSON.stringify({
            topic: "{{latest_trend_topic}}",
            tone: "authoritative",
            audience: "ops leaders",
            campaignGoal: "engagement",
            callToAction: "Book a strategy review",
          }),
        },
      },
    },
    {
      name: "3. CampaignAgent – Create campaign from content",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              ...buildTests({ successCodes: [201] }),
              "const payload = pm.response.json();",
              "const campaign = payload.data || payload;",
              "pm.environment.set('e2e_campaign_id', campaign.id);",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        auth: JSON.parse(JSON.stringify(bearerAuth)),
        url: buildUrl(["campaigns"]),
        header: jsonHeader,
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Multi-agent flow – {{latest_content_title}}",
            type: "multi-channel",
            config: {
              channels: ["email", "social"],
              targeting: {
                audience: "ops leaders",
              },
              budget: {
                total: 1800,
                currency: "USD",
              },
            },
          }),
        },
      },
    },
    {
      name: "4. EmailAgent – Generate sequence",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              ...buildTests({ successCodes: [200] }),
              "const payload = pm.response.json();",
              "pm.expect(payload).to.have.property('success');",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        auth: JSON.parse(JSON.stringify(bearerAuth)),
        url: buildUrl(["campaigns", "{{e2e_campaign_id}}", "email", "sequence"]),
        header: jsonHeader,
        body: {
          mode: "raw",
          raw: JSON.stringify({
            topic: "{{latest_trend_topic}} nurture",
            audience: "pilot-users",
            numEmails: 2,
            tone: "friendly",
          }),
        },
      },
    },
    {
      name: "5. Metrics – Verify campaign analytics",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              ...buildTests({ successCodes: [200] }),
              "const payload = pm.response.json();",
              "pm.expect(payload).to.be.an('object');",
            ],
          },
        },
      ],
      request: {
        method: "GET",
        auth: JSON.parse(JSON.stringify(bearerAuth)),
        url: buildUrl(["campaigns", "{{e2e_campaign_id}}", "analytics"]),
      },
    },
  ],
};

const applyRequests = (folderName, requests) => {
  requests.forEach(request => upsertRequest(folderName, request));
};

const existingFlow = collection.item.find(folder => folder.name === multiAgentFlow.name);
if (existingFlow) {
  existingFlow.item = multiAgentFlow.item;
} else {
  collection.item.push(multiAgentFlow);
}

applyRequests("Campaigns", campaignRequests);
applyRequests("Billing & Finance", billingRequests);
applyRequests("Tasks", taskRequests);
applyRequests("Team & Access", teamRequests);
applyRequests("Governance & Data Trust", governanceRequests);
applyRequests("Connectors", connectorRequests);
applyRequests("Settings", settingsRequests);
applyRequests("SMS & Social", smsSocialRequests);
applyRequests("Metrics & Observability", metricsRequests);
applyRequests("Sitemaps", sitemapRequests);

fs.writeFileSync(COLLECTION_PATH, `${JSON.stringify(collection, null, 2)}\n`);
console.log("Postman collection extended with new regression requests.");
