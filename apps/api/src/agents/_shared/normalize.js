"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratePostInputSchema = exports.GenerateSequenceInputSchema = exports.SocialPlatformSchema = void 0;
exports.normalizeSequenceInput = normalizeSequenceInput;
exports.normalizePostInput = normalizePostInput;
exports.normalizeAgentInput = normalizeAgentInput;
exports.normalizeAgentOutput = normalizeAgentOutput;
exports.validateAgentContext = validateAgentContext;
var zod_1 = require("zod");
var DEFAULT_BRAND_ID = "default-brand";
var sequenceToneOptions = ["witty", "professional", "casual", "friendly", "authoritative"];
exports.SocialPlatformSchema = zod_1.z.enum(["twitter", "linkedin", "facebook", "instagram"]);
exports.GenerateSequenceInputSchema = zod_1.z.object({
    brandId: zod_1.z.string().min(1).default(DEFAULT_BRAND_ID),
    topic: zod_1.z
        .string()
        .min(1, "topic is required")
        .transform(function (value) { return value.trim(); }),
    audience: zod_1.z
        .string()
        .min(1)
        .default("general")
        .transform(function (value) { return value.trim(); }),
    tone: zod_1.z.enum(sequenceToneOptions).default("witty"),
    objective: zod_1.z
        .string()
        .min(1)
        .default("awareness")
        .transform(function (value) { return value.trim(); }),
    length: zod_1.z
        .number()
        .int("length must be an integer")
        .min(1, "length must be at least 1")
        .max(10, "length cannot exceed 10")
        .default(3),
    seed: zod_1.z
        .string()
        .optional()
        .transform(function (value) { return (value ? value.trim() : value); }),
    createdById: zod_1.z
        .string()
        .optional()
        .transform(function (value) { return (value ? value.trim() : value); }),
});
function normalizeSequenceInput(input) {
    var _a, _b;
    var base = exports.GenerateSequenceInputSchema.parse(__assign(__assign({}, input), { length: (_a = input.length) !== null && _a !== void 0 ? _a : input.numEmails }));
    var emails = (_b = input.numEmails) !== null && _b !== void 0 ? _b : base.length;
    return __assign(__assign({}, base), { numEmails: emails });
}
exports.GeneratePostInputSchema = zod_1.z.object({
    brandId: zod_1.z.string().min(1).default(DEFAULT_BRAND_ID),
    content: zod_1.z
        .string()
        .min(1, "content is required")
        .transform(function (value) { return value.trim(); }),
    platform: exports.SocialPlatformSchema.default("instagram"),
    tone: zod_1.z.enum(["professional", "casual", "engaging", "authoritative"]).default("engaging"),
    includeHashtags: zod_1.z.boolean().default(false),
    hashtags: zod_1.z.array(zod_1.z.string().min(1)).default([]),
    callToAction: zod_1.z
        .string()
        .min(1)
        .default("Learn more")
        .transform(function (value) { return value.trim(); }),
    topic: zod_1.z
        .string()
        .min(1)
        .default("brand")
        .transform(function (value) { return value.trim(); }),
    createdById: zod_1.z
        .string()
        .optional()
        .transform(function (value) { return (value ? value.trim() : value); }),
});
function normalizePostInput(input) {
    var normalized = exports.GeneratePostInputSchema.safeParse(__assign({ hashtags: input.includeHashtags === false ? [] : input.hashtags }, input));
    if (normalized.success) {
        return normalized.data;
    }
    throw normalized.error;
}
function normalizeAgentInput(raw, schema) {
    var parsed = schema.safeParse(raw);
    if (!parsed.success) {
        throw new Error("Invalid agent input: ".concat(parsed.error.message));
    }
    return parsed.data;
}
function normalizeAgentOutput(result, schema) {
    var parsed = schema.safeParse(result);
    if (!parsed.success) {
        throw new Error("Invalid agent output: ".concat(parsed.error.message));
    }
    return parsed.data;
}
function validateAgentContext(context) {
    if (!context || typeof context !== "object") {
        throw new Error("Agent context must be provided");
    }
    var record = context;
    var organizationId = typeof record.organizationId === "string" ? record.organizationId.trim() : "";
    if (!organizationId) {
        throw new Error("Missing organizationId in context");
    }
    var prisma = record.prisma;
    if (!prisma) {
        throw new Error("Missing Prisma client in context");
    }
    var logger = record.logger;
    var userId = typeof record.userId === "string" && record.userId.trim().length ? record.userId : undefined;
    return {
        organizationId: organizationId,
        prisma: prisma,
        logger: logger,
        userId: userId,
    };
}
