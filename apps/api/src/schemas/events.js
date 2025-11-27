"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineResponse = exports.TimelineEvent = exports.TimelineQuery = void 0;
var zod_1 = require("zod");
exports.TimelineQuery = zod_1.z.object({
    personId: zod_1.z.string(),
    limit: zod_1.z.coerce.number().min(1).max(200).default(50),
});
exports.TimelineEvent = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    channel: zod_1.z.string().nullable(),
    ts: zod_1.z.string(),
    payload: zod_1.z.record(zod_1.z.any()),
});
exports.TimelineResponse = zod_1.z.object({
    events: zod_1.z.array(exports.TimelineEvent),
});
