"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentJobSchema = exports.TrackEventRequestSchema = exports.ContentDraftSchema = exports.GenerateContentRequestSchema = exports.HealthResponseSchema = void 0;
var zod_1 = require("zod");
// Health check response
exports.HealthResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(["ok", "error"]),
    db: zod_1.z.boolean(),
    ws: zod_1.z.boolean(),
    version: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
// Content generation
exports.GenerateContentRequestSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, "Topic is required"),
    tone: zod_1.z.enum(["professional", "casual", "friendly", "authoritative"]).default("professional"),
    audience: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    brandId: zod_1.z.string().uuid("brandId must be a valid UUID").optional(),
    brandVoiceId: zod_1.z.string().uuid("brandVoiceId must be a valid UUID").optional(),
    campaignGoal: zod_1.z
        .enum(["awareness", "engagement", "conversion", "retention"])
        .default("awareness"),
    callToAction: zod_1.z.string().min(1).optional(),
});
exports.ContentDraftSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    topic: zod_1.z.string(),
    body: zod_1.z.string(),
    status: zod_1.z.enum(["draft", "generated", "published"]),
    createdById: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Metrics
exports.TrackEventRequestSchema = zod_1.z.object({
    type: zod_1.z.string(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
});
// Agent Job
exports.AgentJobSchema = zod_1.z.object({
    id: zod_1.z.string(),
    agent: zod_1.z.string(),
    input: zod_1.z.record(zod_1.z.any()),
    output: zod_1.z.record(zod_1.z.any()).nullable(),
    status: zod_1.z.enum(["queued", "running", "success", "error"]),
    error: zod_1.z.string().nullable(),
    metrics: zod_1.z.record(zod_1.z.any()).nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
__exportStar(require("./agentic"), exports);
