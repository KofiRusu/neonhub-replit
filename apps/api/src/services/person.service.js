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
exports.PersonService = void 0;
var prisma_js_1 = require("../lib/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var memory_service_js_1 = require("./rag/memory.service.js");
var _identityTypes = ["email", "phone", "handle"];
function ensureIdentifier(ident) {
    if (!ident.email && !ident.phone && !ident.handle && !ident.externalId) {
        throw new Error("At least one identifier (email, phone, handle, externalId) is required");
    }
}
function normalizeChannel(type) {
    switch (type) {
        case "email":
            return "email";
        case "phone":
            return "sms";
        case "handle":
            return "dm";
        default:
            return "direct";
    }
}
var vectorToArray = function (embedding) {
    if (!embedding)
        return null;
    if (Array.isArray(embedding)) {
        return embedding.map(function (value) { return Number(value); });
    }
    if (typeof embedding === "object" && embedding !== null) {
        var maybeBuffer = embedding;
        if (Array.isArray(maybeBuffer.values))
            return maybeBuffer.values.map(function (value) { return Number(value); });
        if (Array.isArray(maybeBuffer.data))
            return maybeBuffer.data.map(function (value) { return Number(value); });
    }
    if (typeof embedding === "string") {
        try {
            var parsed = JSON.parse(embedding);
            return Array.isArray(parsed) ? parsed.map(function (value) { return Number(value); }) : null;
        }
        catch (err) {
            logger_js_1.logger.warn({ err: err, embedding: embedding }, "Unable to parse embedding string");
        }
    }
    return null;
};
function getPersonOrThrow(personId) {
    return __awaiter(this, void 0, void 0, function () {
        var person;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({ where: { id: personId } })];
                case 1:
                    person = _a.sent();
                    if (!person) {
                        throw new Error("Person not found for id ".concat(personId));
                    }
                    return [2 /*return*/, person];
            }
        });
    });
}
function attachIdentities(tx, personId, organizationId, payloads) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!payloads.length)
                        return [2 /*return*/];
                    return [4 /*yield*/, Promise.all(payloads.map(function (payload) {
                            var _a;
                            return tx.identity.upsert({
                                where: {
                                    organizationId_type_value: {
                                        organizationId: organizationId,
                                        type: payload.type,
                                        value: payload.value,
                                    },
                                },
                                update: { personId: personId },
                                create: {
                                    personId: personId,
                                    organizationId: organizationId,
                                    type: payload.type,
                                    value: payload.value,
                                    channel: (_a = payload.channel) !== null && _a !== void 0 ? _a : normalizeChannel(payload.type),
                                },
                            });
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function buildIdentityPayloads(ident) {
    var payloads = [];
    if (ident.email) {
        payloads.push({ type: "email", value: ident.email.toLowerCase(), channel: "email" });
    }
    if (ident.phone) {
        payloads.push({ type: "phone", value: ident.phone, channel: "sms" });
    }
    if (ident.handle) {
        payloads.push({ type: "handle", value: ident.handle.toLowerCase(), channel: "dm" });
    }
    return payloads;
}
function buildIdentityWhere(ident) {
    var where = [];
    if (ident.email)
        where.push({ type: "email", value: ident.email.toLowerCase() });
    if (ident.phone)
        where.push({ type: "phone", value: ident.phone });
    if (ident.handle)
        where.push({ type: "handle", value: ident.handle.toLowerCase() });
    return where;
}
function persistPersonTraits(tx, personId, traits) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!traits || !Object.keys(traits).length)
                        return [2 /*return*/];
                    return [4 /*yield*/, tx.person.update({
                            where: { id: personId },
                            data: {
                                attributes: __assign({}, (traits !== null && traits !== void 0 ? traits : {})),
                            },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.PersonService = {
    memory: new memory_service_js_1.MemoryRagService(),
    resolve: function (ident) {
        return __awaiter(this, void 0, void 0, function () {
            var organizationId, externalId;
            var _this = this;
            return __generator(this, function (_a) {
                ensureIdentifier(ident);
                organizationId = ident.organizationId, externalId = ident.externalId;
                return [2 /*return*/, prisma_js_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                        var identityMatches, personId, identity, existing, directMatch, created, payloads;
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    identityMatches = buildIdentityWhere(ident);
                                    personId = null;
                                    if (!identityMatches.length) return [3 /*break*/, 2];
                                    return [4 /*yield*/, tx.identity.findFirst({
                                            where: {
                                                organizationId: organizationId,
                                                OR: identityMatches,
                                            },
                                            select: {
                                                id: true,
                                                personId: true,
                                                type: true,
                                                value: true,
                                            },
                                        })];
                                case 1:
                                    identity = _k.sent();
                                    if (identity === null || identity === void 0 ? void 0 : identity.personId) {
                                        personId = identity.personId;
                                    }
                                    _k.label = 2;
                                case 2:
                                    if (!(!personId && externalId)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, tx.person.findUnique({
                                            where: {
                                                organizationId_externalId: {
                                                    organizationId: organizationId,
                                                    externalId: externalId,
                                                },
                                            },
                                            select: { id: true },
                                        })];
                                case 3:
                                    existing = _k.sent();
                                    if (existing) {
                                        personId = existing.id;
                                    }
                                    _k.label = 4;
                                case 4:
                                    if (!!personId) return [3 /*break*/, 6];
                                    return [4 /*yield*/, tx.person.findFirst({
                                            where: {
                                                organizationId: organizationId,
                                                OR: [
                                                    ident.email ? { primaryEmail: ident.email.toLowerCase() } : undefined,
                                                    ident.phone ? { primaryPhone: ident.phone } : undefined,
                                                    ident.handle ? { primaryHandle: ident.handle.toLowerCase() } : undefined,
                                                    externalId ? { externalId: externalId } : undefined,
                                                ].filter(Boolean),
                                            },
                                            select: { id: true },
                                        })];
                                case 5:
                                    directMatch = _k.sent();
                                    if (directMatch) {
                                        personId = directMatch.id;
                                    }
                                    _k.label = 6;
                                case 6:
                                    if (!!personId) return [3 /*break*/, 8];
                                    if (ident.createIfMissing === false) {
                                        throw new Error("Person not found for provided identifiers");
                                    }
                                    return [4 /*yield*/, tx.person.create({
                                            data: {
                                                organizationId: organizationId,
                                                externalId: externalId !== null && externalId !== void 0 ? externalId : undefined,
                                                displayName: (_a = ident.traits) === null || _a === void 0 ? void 0 : _a.name,
                                                primaryEmail: (_b = ident.email) === null || _b === void 0 ? void 0 : _b.toLowerCase(),
                                                primaryPhone: ident.phone,
                                                primaryHandle: (_c = ident.handle) === null || _c === void 0 ? void 0 : _c.toLowerCase(),
                                                attributes: (_d = ident.traits) !== null && _d !== void 0 ? _d : undefined,
                                            },
                                            select: { id: true },
                                        })];
                                case 7:
                                    created = _k.sent();
                                    personId = created.id;
                                    return [3 /*break*/, 10];
                                case 8: return [4 /*yield*/, tx.person.update({
                                        where: { id: personId },
                                        data: __assign({ primaryEmail: (_f = (_e = ident.email) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== null && _f !== void 0 ? _f : undefined, primaryPhone: (_g = ident.phone) !== null && _g !== void 0 ? _g : undefined, primaryHandle: (_j = (_h = ident.handle) === null || _h === void 0 ? void 0 : _h.toLowerCase()) !== null && _j !== void 0 ? _j : undefined }, (ident.traits ? { attributes: ident.traits } : {})),
                                    })];
                                case 9:
                                    _k.sent();
                                    _k.label = 10;
                                case 10:
                                    payloads = buildIdentityPayloads(ident);
                                    return [4 /*yield*/, attachIdentities(tx, personId, organizationId, payloads)];
                                case 11:
                                    _k.sent();
                                    return [4 /*yield*/, persistPersonTraits(tx, personId, ident.traits)];
                                case 12:
                                    _k.sent();
                                    return [2 /*return*/, personId];
                            }
                        });
                    }); })];
            });
        });
    },
    getMemory: function (personId_1) {
        return __awaiter(this, arguments, void 0, function (personId, opts) {
            var limit, memories;
            var _a;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        limit = opts.limit && opts.limit > 0 ? opts.limit : undefined;
                        return [4 /*yield*/, prisma_js_1.prisma.memEmbedding.findMany(__assign(__assign({ where: __assign({ personId: personId }, (opts.since ? { createdAt: { gte: opts.since } } : {})), orderBy: { createdAt: "desc" } }, (limit ? { take: limit } : {})), { include: {
                                    sourceEvent: (_a = opts.includeEvents) !== null && _a !== void 0 ? _a : false,
                                } }))];
                    case 1:
                        memories = _b.sent();
                        return [2 /*return*/, memories.map(function (memory) {
                                var _a;
                                return ({
                                    id: memory.id,
                                    personId: memory.personId,
                                    label: memory.label,
                                    summary: (_a = memory.metadata) === null || _a === void 0 ? void 0 : _a.summary,
                                    embedding: opts.includeVectors === false ? null : vectorToArray(memory.embedding),
                                    metadata: memory.metadata,
                                    sourceEventId: memory.sourceEventId,
                                    createdAt: memory.createdAt,
                                    expiresAt: memory.expiresAt,
                                });
                            })];
                }
            });
        });
    },
    updateTopic: function (personId, topic, weight) {
        return __awaiter(this, void 0, void 0, function () {
            var person;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPersonOrThrow(personId)];
                    case 1:
                        person = _a.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.topic.upsert({
                                where: {
                                    personId_name: {
                                        personId: personId,
                                        name: topic.toLowerCase(),
                                    },
                                },
                                create: {
                                    personId: personId,
                                    organizationId: person.organizationId,
                                    name: topic.toLowerCase(),
                                    weight: weight,
                                },
                                update: {
                                    weight: weight,
                                },
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    addNote: function (personId, note, authorId) {
        return __awaiter(this, void 0, void 0, function () {
            var person, payload, created, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, getPersonOrThrow(personId)];
                    case 1:
                        person = _e.sent();
                        payload = typeof note === "string" ? { body: note } : note;
                        return [4 /*yield*/, prisma_js_1.prisma.note.create({
                                data: {
                                    personId: personId,
                                    organizationId: person.organizationId,
                                    authorId: authorId !== null && authorId !== void 0 ? authorId : null,
                                    body: payload.body,
                                    tags: (_a = payload.tags) !== null && _a !== void 0 ? _a : [],
                                    visibility: (_b = payload.visibility) !== null && _b !== void 0 ? _b : "internal",
                                },
                            })];
                    case 2:
                        created = _e.sent();
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.memory.storeSnippet({
                                organizationId: person.organizationId,
                                personId: personId,
                                label: "support_note",
                                text: payload.body,
                                category: "support",
                                metadata: {
                                    tags: (_c = payload.tags) !== null && _c !== void 0 ? _c : [],
                                    visibility: (_d = payload.visibility) !== null && _d !== void 0 ? _d : "internal",
                                    authorId: authorId !== null && authorId !== void 0 ? authorId : null,
                                    noteId: created.id,
                                },
                            })];
                    case 4:
                        _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _e.sent();
                        logger_js_1.logger.warn({ error: error_1, personId: personId }, "Failed to store support note memory");
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    getConsent: function (personId, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var consent;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.consent.findFirst({
                            where: { personId: personId, channel: channel },
                            orderBy: { updatedAt: "desc" },
                        })];
                    case 1:
                        consent = _b.sent();
                        return [2 /*return*/, ((_a = consent === null || consent === void 0 ? void 0 : consent.status) !== null && _a !== void 0 ? _a : null)];
                }
            });
        });
    },
};
