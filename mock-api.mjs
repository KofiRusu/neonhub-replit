import http from "node:http";

const routes = {
  "POST /brand-voice/compose": async (body) => ({
    subjectLines: ["Quick idea"],
    htmlVariants: ["<p>hey!</p>"],
    body: "hey!",
    meta: { source: "ultra-mock" },
  }),
  "POST /sms/send": async () => ({ id: "sm_1", status: "queued", providerId: "mock" }),
  "GET /events/timeline": async () => ({ events: [] }),
};

const server = http.createServer(async (req, res) => {
  const key = `${req.method} ${req.url?.split("?")[0] ?? ""}`;
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const json = body ? JSON.parse(body) : undefined;
  const handler = routes[key] ?? (async () => ({ ok: true, key, json }));
  const output = await handler(json);

  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(output));
});

server.listen(4000, () => {
  console.log("Ultra-mock on :4000");
});
