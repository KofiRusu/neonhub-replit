"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsSummaryQuerySchema = exports.MetricEventInputSchema = void 0;
var zod_1 = require("zod");
exports.MetricEventInputSchema = zod_1.z.object({
    type: zod_1.z.enum([
        "page_view",
        "click",
        "conversion",
        "open",
        "job_success",
        "job_error",
        "draft_created",
        "agent_run",
    ]),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.MetricsSummaryQuerySchema = zod_1.z.object({
    range: zod_1.z.enum(["24h", "7d", "30d"]).default("30d"),
});
