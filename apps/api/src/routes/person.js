"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var person_service_js_1 = require("../services/person.service.js");
var http_js_1 = require("../lib/http.js");
var agentic_js_1 = require("../types/agentic.js");
var prisma_js_1 = require("../lib/prisma.js");
exports.personRouter = (0, express_1.Router)();
var memoryQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(50).optional(),
    since: zod_1.z.string().datetime().optional(),
    includeVectors: zod_1.z.coerce.boolean().optional(),
    includeEvents: zod_1.z.coerce.boolean().optional(),
});
var consentSchema = zod_1.z.object({
    channel: zod_1.z.string().min(1),
    status: zod_1.z.enum(["granted", "revoked", "denied", "pending"]),
    source: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
});
exports.personRouter.post("/resolve", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, personId, error_1, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                payload = agentic_js_1.IdentityDescriptorSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                return [4 /*yield*/, person_service_js_1.PersonService.resolve(payload)];
            case 1:
                personId = _d.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)({ personId: personId }))];
            case 2:
                error_1 = _d.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_1.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_1 instanceof Error ? error_1.message : "Failed to resolve person";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.personRouter.get("/:id/memory", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, query, memories, error_2, message;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                id = req.params.id;
                query = memoryQuerySchema.parse(req.query);
                return [4 /*yield*/, person_service_js_1.PersonService.getMemory(id, {
                        limit: query.limit,
                        since: query.since ? new Date(query.since) : undefined,
                        includeVectors: query.includeVectors,
                        includeEvents: query.includeEvents,
                    })];
            case 1:
                memories = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(memories))];
            case 2:
                error_2 = _c.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_2.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid query").body)];
                }
                message = error_2 instanceof Error ? error_2.message : "Failed to retrieve memory";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.personRouter.get("/:id/topics", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topics, error_3, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_js_1.prisma.topic.findMany({
                        where: { personId: req.params.id },
                        orderBy: { weight: "desc" },
                        select: {
                            id: true,
                            name: true,
                            weight: true,
                            updatedAt: true,
                        },
                    })];
            case 1:
                topics = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(topics))];
            case 2:
                error_3 = _a.sent();
                message = error_3 instanceof Error ? error_3.message : "Failed to load topics";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.personRouter.post("/:id/consent", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, channel, status_1, source, metadata, expiresAt, person, consent, error_4, message;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = consentSchema.parse((_b = req.body) !== null && _b !== void 0 ? _b : {}), channel = _a.channel, status_1 = _a.status, source = _a.source, metadata = _a.metadata, expiresAt = _a.expiresAt;
                return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({
                        where: { id: req.params.id },
                        select: { organizationId: true },
                    })];
            case 1:
                person = _e.sent();
                if (!person) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Person not found").body)];
                }
                return [4 /*yield*/, prisma_js_1.prisma.consent.create({
                        data: {
                            personId: req.params.id,
                            organizationId: person.organizationId,
                            channel: channel,
                            status: status_1,
                            source: source !== null && source !== void 0 ? source : "manual",
                            metadata: (metadata !== null && metadata !== void 0 ? metadata : {}),
                            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                        },
                    })];
            case 2:
                consent = _e.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(consent))];
            case 3:
                error_4 = _e.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_d = (_c = error_4.errors[0]) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Invalid request").body)];
                }
                message = error_4 instanceof Error ? error_4.message : "Failed to update consent";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.personRouter;
