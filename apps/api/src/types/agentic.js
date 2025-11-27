"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityDescriptorSchema = exports.OBJECTIVE_TYPES = exports.DEFAULT_CHANNEL = exports.CHANNELS = void 0;
exports.normalizeChannel = normalizeChannel;
var zod_1 = require("zod");
var CHANNEL_VALUES = [
    "email",
    "sms",
    "dm",
    "post",
    "social",
    "push",
    "voice",
    "instagram",
    "facebook",
    "x",
    "reddit",
    "whatsapp",
    "tiktok",
    "youtube",
    "linkedin",
    "site",
];
exports.CHANNELS = CHANNEL_VALUES;
var CHANNEL_SET = new Set(CHANNEL_VALUES);
exports.DEFAULT_CHANNEL = "email";
function normalizeChannel(value, fallback) {
    if (fallback === void 0) { fallback = exports.DEFAULT_CHANNEL; }
    if (!value) {
        return fallback;
    }
    var normalized = value.trim().toLowerCase();
    return CHANNEL_SET.has(normalized) ? normalized : fallback;
}
var OBJECTIVE_VALUES = [
    "nurture",
    "winback",
    "demo_book",
    "upsell",
    "cross_sell",
    "onboard",
    "support",
    "education",
];
exports.OBJECTIVE_TYPES = OBJECTIVE_VALUES;
exports.IdentityDescriptorSchema = zod_1.z.object({
    organizationId: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(5).optional(),
    handle: zod_1.z.string().min(2).optional(),
    externalId: zod_1.z.string().optional(),
    brandId: zod_1.z.string().optional(),
    createIfMissing: zod_1.z.boolean().default(true),
    traits: zod_1.z.record(zod_1.z.unknown()).optional(),
});
