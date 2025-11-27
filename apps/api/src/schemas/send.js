"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendResult = exports.SendSMSArgs = exports.SendEmailArgs = void 0;
var zod_1 = require("zod");
exports.SendEmailArgs = zod_1.z.object({
    to: zod_1.z.string(),
    subject: zod_1.z.string(),
    html: zod_1.z.string(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.SendSMSArgs = zod_1.z.object({
    to: zod_1.z.string(),
    body: zod_1.z.string().max(320),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.SendResult = zod_1.z.object({
    id: zod_1.z.string(),
    status: zod_1.z.enum(["queued", "sent", "failed"]),
    providerId: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
});
