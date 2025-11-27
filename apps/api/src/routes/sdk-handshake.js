"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkHandshakeRouter = void 0;
var express_1 = require("express");
var brand_voice_js_1 = require("../schemas/brand-voice.js");
var send_js_1 = require("../schemas/send.js");
var events_js_1 = require("../schemas/events.js");
exports.sdkHandshakeRouter = (0, express_1.Router)();
exports.sdkHandshakeRouter.post("/brand-voice/compose", function (req, res) {
    var args = brand_voice_js_1.ComposeArgs.parse(req.body);
    var response = args.channel === "email"
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
exports.sdkHandshakeRouter.post("/brand-voice/guardrail", function (req, res) {
    // For now we just always return safe=true. Extend once guardrails wire up.
    res.json({ safe: true, violations: [], meta: { source: "sdk-handshake" } });
});
exports.sdkHandshakeRouter.post("/email/send", function (req, res) {
    send_js_1.SendEmailArgs.parse(req.body);
    var result = send_js_1.SendResult.parse({
        id: "em_1",
        status: "queued",
        providerId: "mock-provider",
    });
    res.json(result);
});
exports.sdkHandshakeRouter.post("/sms/send", function (req, res) {
    send_js_1.SendSMSArgs.parse(req.body);
    var result = send_js_1.SendResult.parse({
        id: "sm_1",
        status: "queued",
        providerId: "mock-provider",
    });
    res.json(result);
});
exports.sdkHandshakeRouter.get("/events/timeline", function (req, res) {
    var query = events_js_1.TimelineQuery.parse(req.query);
    var payload = events_js_1.TimelineResponse.parse({
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
