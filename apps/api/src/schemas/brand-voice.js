"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeResult = exports.ComposeArgs = void 0;
var zod_1 = require("zod");
exports.ComposeArgs = zod_1.z.object({
    channel: zod_1.z.enum(["email", "sms", "dm", "post"]),
    objective: zod_1.z.string().min(2),
    personId: zod_1.z.string(),
    constraints: zod_1.z.any().optional(),
});
exports.ComposeResult = zod_1.z.object({
    subjectLines: zod_1.z.array(zod_1.z.string()).optional(),
    htmlVariants: zod_1.z.array(zod_1.z.string()).optional(),
    body: zod_1.z.string().optional(),
    meta: zod_1.z.record(zod_1.z.any()).default({}),
});
