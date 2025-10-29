import { Router } from "express";
import { ComposeArgs as ComposeArgsSchema } from "../schemas/brand-voice.js";
import {
  SendEmailArgs as SendEmailArgsSchema,
  SendSMSArgs as SendSMSArgsSchema,
  SendResult as SendResultSchema,
} from "../schemas/send.js";
import {
  TimelineQuery as TimelineQuerySchema,
  TimelineResponse as TimelineResponseSchema,
} from "../schemas/events.js";

export const sdkHandshakeRouter: Router = Router();

sdkHandshakeRouter.post("/brand-voice/compose", (req, res) => {
  const args = ComposeArgsSchema.parse(req.body);

  const response =
    args.channel === "email"
      ? {
          subjectLines: ["Quick idea about your workflow"],
          htmlVariants: ["<p>hey {{firstName}}, quick one…</p>"],
          body: "hey {{firstName}}, quick idea for streamlining your nurture flow.",
          meta: { source: "sdk-handshake" },
        }
      : {
          body: "hey! quick one—got a sec?",
          meta: { source: "sdk-handshake" },
        };

  res.json(response);
});

sdkHandshakeRouter.post("/brand-voice/guardrail", (req, res) => {
  // For now we just always return safe=true. Extend once guardrails wire up.
  res.json({ safe: true, violations: [], meta: { source: "sdk-handshake" } });
});

sdkHandshakeRouter.post("/email/send", (req, res) => {
  SendEmailArgsSchema.parse(req.body);
  const result = SendResultSchema.parse({
    id: "em_1",
    status: "queued",
    providerId: "mock-provider",
  });
  res.json(result);
});

sdkHandshakeRouter.post("/sms/send", (req, res) => {
  SendSMSArgsSchema.parse(req.body);
  const result = SendResultSchema.parse({
    id: "sm_1",
    status: "queued",
    providerId: "mock-provider",
  });
  res.json(result);
});

sdkHandshakeRouter.get("/events/timeline", (req, res) => {
  const query = TimelineQuerySchema.parse(req.query);
  const payload = TimelineResponseSchema.parse({
    events: [
      {
        id: "evt_1",
        type: "sms.send",
        channel: "sms",
        ts: new Date().toISOString(),
        payload: { body: "hi from sdk handshake", personId: query.personId },
      },
    ],
  });
  res.json(payload);
});
