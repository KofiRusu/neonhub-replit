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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.addMessage = addMessage;
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.getMessageById = getMessageById;
exports.markMessageAsRead = markMessageAsRead;
exports.markThreadAsRead = markThreadAsRead;
exports.deleteMessage = deleteMessage;
exports.getUnreadCount = getUnreadCount;
exports.getThreads = getThreads;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var mappers_js_1 = require("../lib/mappers.js");
var PARTICIPANTS_KEY = "participants";
var READ_BY_KEY = "readBy";
var LEGACY_KEY = "legacy";
var SUBJECT_KEY = "subject";
var TAGS_KEY = "tags";
var toJsonValue = function (value) { return value; };
var toJsonObject = function (input) {
    if (!input) {
        return undefined;
    }
    var result = {};
    for (var _i = 0, _a = Object.entries(input); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
};
var uniqueStrings = function (values) {
    var result = new Set();
    for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
        var value = values_1[_i];
        if (typeof value === "string" && value.trim().length > 0) {
            result.add(value);
        }
    }
    return Array.from(result);
};
var metadataRecord = function (value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return __assign({}, value);
};
var ensureStringArray = function (input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input.filter(function (entry) { return typeof entry === "string" && entry.trim().length > 0; });
};
var sanitizeExtras = function (input, reserved) {
    if (!input) {
        return undefined;
    }
    var clone = __assign({}, input);
    for (var _i = 0, reserved_1 = reserved; _i < reserved_1.length; _i++) {
        var key = reserved_1[_i];
        delete clone[key];
    }
    return Object.keys(clone).length ? clone : undefined;
};
var participantsFromMetadata = function (value) {
    var record = metadataRecord(value);
    var raw = record[PARTICIPANTS_KEY];
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter(function (entry) { return typeof entry === "string"; });
};
var hasRead = function (value, userId) {
    if (!userId) {
        return false;
    }
    var metadata = messageMetadataFrom(value);
    return metadata.readBy.includes(userId);
};
var serializeConversationMetadata = function (metadata) {
    var _a;
    var record = {};
    if (metadata.participants.length) {
        record[PARTICIPANTS_KEY] = metadata.participants;
    }
    if (metadata.subject) {
        record[SUBJECT_KEY] = metadata.subject;
    }
    if ((_a = metadata.tags) === null || _a === void 0 ? void 0 : _a.length) {
        record[TAGS_KEY] = metadata.tags;
    }
    var legacyRecord = toJsonObject(metadata.legacy);
    if (legacyRecord && Object.keys(legacyRecord).length) {
        record[LEGACY_KEY] = legacyRecord;
    }
    var extraRecord = toJsonObject(metadata.extra);
    if (extraRecord) {
        for (var _i = 0, _b = Object.entries(extraRecord); _i < _b.length; _i++) {
            var _c = _b[_i], key = _c[0], value = _c[1];
            record[key] = value;
        }
    }
    return record;
};
var serializeMessageMetadata = function (metadata) {
    var _a;
    var record = {};
    if (metadata.subject) {
        record[SUBJECT_KEY] = metadata.subject;
    }
    if (metadata.receiverId) {
        record.receiverId = metadata.receiverId;
    }
    if (metadata.replyToId) {
        record.replyToId = metadata.replyToId;
    }
    if ((_a = metadata.attachments) === null || _a === void 0 ? void 0 : _a.length) {
        record.attachments = metadata.attachments;
    }
    record[READ_BY_KEY] = metadata.readBy;
    var legacyRecord = toJsonObject(metadata.legacy);
    if (legacyRecord && Object.keys(legacyRecord).length) {
        record[LEGACY_KEY] = legacyRecord;
    }
    var extraRecord = toJsonObject(metadata.extra);
    if (extraRecord) {
        for (var _i = 0, _b = Object.entries(extraRecord); _i < _b.length; _i++) {
            var _c = _b[_i], key = _c[0], value = _c[1];
            record[key] = value;
        }
    }
    return record;
};
var conversationMetadataFrom = function (value) {
    var record = metadataRecord(value);
    var extras = {};
    for (var _i = 0, _a = Object.entries(record); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], val = _b[1];
        if (![PARTICIPANTS_KEY, SUBJECT_KEY, TAGS_KEY, LEGACY_KEY].includes(key)) {
            extras[key] = val;
        }
    }
    return {
        participants: ensureStringArray(record[PARTICIPANTS_KEY]),
        subject: typeof record[SUBJECT_KEY] === "string" ? record[SUBJECT_KEY] : undefined,
        tags: ensureStringArray(record[TAGS_KEY]),
        legacy: record[LEGACY_KEY] && typeof record[LEGACY_KEY] === "object" && !Array.isArray(record[LEGACY_KEY])
            ? record[LEGACY_KEY]
            : undefined,
        extra: Object.keys(extras).length ? extras : undefined,
    };
};
var messageMetadataFrom = function (value) {
    var record = metadataRecord(value);
    var extras = {};
    for (var _i = 0, _a = Object.entries(record); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], val = _b[1];
        if (![SUBJECT_KEY, READ_BY_KEY, LEGACY_KEY, "receiverId", "replyToId", "attachments"].includes(key)) {
            extras[key] = val;
        }
    }
    var readBy = Array.isArray(record[READ_BY_KEY])
        ? ensureStringArray(record[READ_BY_KEY])
        : typeof record[READ_BY_KEY] === "object" && record[READ_BY_KEY]
            ? Object.keys(record[READ_BY_KEY])
            : [];
    return {
        subject: typeof record[SUBJECT_KEY] === "string" ? record[SUBJECT_KEY] : undefined,
        receiverId: typeof record.receiverId === "string" ? record.receiverId : undefined,
        replyToId: typeof record.replyToId === "string" ? record.replyToId : undefined,
        attachments: ensureStringArray(record.attachments),
        readBy: readBy,
        legacy: record[LEGACY_KEY] && typeof record[LEGACY_KEY] === "object" && !Array.isArray(record[LEGACY_KEY])
            ? record[LEGACY_KEY]
            : undefined,
        extra: Object.keys(extras).length ? extras : undefined,
    };
};
function resolveOrganizationId(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var membership;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!userId) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.organizationMembership.findFirst({
                            where: { userId: userId },
                            select: { organizationId: true },
                        })];
                case 1:
                    membership = _b.sent();
                    return [2 /*return*/, (_a = membership === null || membership === void 0 ? void 0 : membership.organizationId) !== null && _a !== void 0 ? _a : undefined];
            }
        });
    });
}
function mergeConversationParticipants(conversationId, participants) {
    return __awaiter(this, void 0, void 0, function () {
        var additions, conversation, metadata, existing, merged, serialized;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    additions = uniqueStrings(participants);
                    if (additions.length === 0) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.findUnique({
                            where: { id: conversationId },
                            select: { metadata: true },
                        })];
                case 1:
                    conversation = _a.sent();
                    if (!conversation) {
                        return [2 /*return*/];
                    }
                    metadata = conversationMetadataFrom(conversation.metadata);
                    existing = metadata.participants;
                    merged = Array.from(new Set(__spreadArray(__spreadArray([], existing, true), additions, true)));
                    if (merged.length === existing.length) {
                        return [2 /*return*/];
                    }
                    serialized = serializeConversationMetadata(__assign(__assign({}, metadata), { participants: merged }));
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.update({
                            where: { id: conversationId },
                            data: { metadata: serialized },
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function findConversationIds(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var conversations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.conversation.findMany({
                        where: {
                            OR: [
                                { createdById: userId },
                                {
                                    metadata: {
                                        path: [PARTICIPANTS_KEY],
                                        array_contains: userId,
                                    },
                                },
                            ],
                        },
                        select: { id: true },
                    })];
                case 1:
                    conversations = _a.sent();
                    return [2 /*return*/, conversations.map(function (conversation) { return conversation.id; })];
            }
        });
    });
}
function createConversation(input) {
    return __awaiter(this, void 0, void 0, function () {
        var participants, tags, combinedMetadata, legacy, extras, conversationMetadata, organizationId, _a, _b, organization, createdBy, kind, status, metadataToPersist, conversation;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    participants = uniqueStrings((_c = input.participants) !== null && _c !== void 0 ? _c : []);
                    tags = uniqueStrings((_d = input.tags) !== null && _d !== void 0 ? _d : []);
                    combinedMetadata = __assign(__assign({}, ((_e = input.metadata) !== null && _e !== void 0 ? _e : {})), ((_f = input.extra) !== null && _f !== void 0 ? _f : {}));
                    if (combinedMetadata[LEGACY_KEY] && typeof combinedMetadata[LEGACY_KEY] === "object") {
                        legacy = combinedMetadata[LEGACY_KEY];
                        delete combinedMetadata[LEGACY_KEY];
                    }
                    extras = sanitizeExtras(combinedMetadata, [PARTICIPANTS_KEY, SUBJECT_KEY, TAGS_KEY, READ_BY_KEY]);
                    conversationMetadata = serializeConversationMetadata({
                        participants: participants,
                        subject: input.subject,
                        tags: tags,
                        legacy: legacy,
                        extra: extras,
                    });
                    if (!((_g = input.organizationId) !== null && _g !== void 0)) return [3 /*break*/, 1];
                    _b = _g;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, resolveOrganizationId(input.createdById)];
                case 2:
                    _b = (_o.sent());
                    _o.label = 3;
                case 3:
                    if (!((_h = _b) !== null && _h !== void 0)) return [3 /*break*/, 4];
                    _a = _h;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, resolveOrganizationId(participants[0])];
                case 5:
                    _a = (_o.sent());
                    _o.label = 6;
                case 6:
                    organizationId = _a;
                    if (!organizationId) {
                        throw new Error("Organization context not found for conversation");
                    }
                    organization = (0, mappers_js_1.connectById)(organizationId);
                    createdBy = (0, mappers_js_1.connectById)(input.createdById);
                    kind = (_j = input.kind) !== null && _j !== void 0 ? _j : "support";
                    status = (_k = input.status) !== null && _k !== void 0 ? _k : "active";
                    metadataToPersist = Object.keys(conversationMetadata).length ? conversationMetadata : undefined;
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.create({
                            data: __assign(__assign({ title: (_m = (_l = input.title) !== null && _l !== void 0 ? _l : input.subject) !== null && _m !== void 0 ? _m : "Conversation", kind: kind, status: status, organization: organization }, (createdBy ? { createdBy: createdBy } : {})), (metadataToPersist ? { metadata: metadataToPersist } : {})),
                        })];
                case 7:
                    conversation = _o.sent();
                    logger_js_1.logger.info({ conversationId: conversation.id, kind: kind, status: status }, "Conversation created");
                    return [2 /*return*/, conversation];
            }
        });
    });
}
function addMessage(input) {
    return __awaiter(this, void 0, void 0, function () {
        var author, metadataPayload, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    author = (0, mappers_js_1.connectById)(input.authorId);
                    metadataPayload = input.metadata ? serializeMessageMetadata(input.metadata) : undefined;
                    return [4 /*yield*/, prisma_js_1.prisma.message.create({
                            data: __assign(__assign(__assign({ conversation: { connect: { id: input.conversationId } } }, (author ? { author: author } : {})), { role: (_a = input.role) !== null && _a !== void 0 ? _a : "user", contentJson: toJsonValue(input.content) }), (metadataPayload ? { metadata: metadataPayload } : {})),
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    message = _b.sent();
                    logger_js_1.logger.info({ messageId: message.id, conversationId: input.conversationId }, "Message stored");
                    return [2 /*return*/, message];
            }
        });
    });
}
function sendMessage(senderId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var conversationId, participants, metadataSource, normalizedSubject, attachments, receiverId, replyToId, metadataLegacy, tagCandidates, tags, conversationExtra, messageExtra, conversationIdToUse, conversation, organizationId, _a, conversation, existing, conversationMetadata, metadataChanged, mergedTags, messageMetadata;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    conversationId = (_b = input.conversationId) !== null && _b !== void 0 ? _b : input.threadId;
                    participants = uniqueStrings([senderId, input.receiverId]);
                    metadataSource = input.metadata && typeof input.metadata === "object"
                        ? input.metadata
                        : undefined;
                    normalizedSubject = (_c = input.subject) !== null && _c !== void 0 ? _c : (typeof (metadataSource === null || metadataSource === void 0 ? void 0 : metadataSource[SUBJECT_KEY]) === "string" ? metadataSource[SUBJECT_KEY] : undefined);
                    attachments = (_d = input.attachments) !== null && _d !== void 0 ? _d : ensureStringArray(metadataSource === null || metadataSource === void 0 ? void 0 : metadataSource.attachments);
                    receiverId = (_e = input.receiverId) !== null && _e !== void 0 ? _e : (typeof (metadataSource === null || metadataSource === void 0 ? void 0 : metadataSource.receiverId) === "string" ? metadataSource.receiverId : undefined);
                    replyToId = (_f = input.replyToId) !== null && _f !== void 0 ? _f : (typeof (metadataSource === null || metadataSource === void 0 ? void 0 : metadataSource.replyToId) === "string" ? metadataSource.replyToId : undefined);
                    metadataLegacy = metadataSource && typeof metadataSource[LEGACY_KEY] === "object" && !Array.isArray(metadataSource[LEGACY_KEY])
                        ? metadataSource[LEGACY_KEY]
                        : undefined;
                    tagCandidates = __spreadArray(__spreadArray([], ((_g = input.tags) !== null && _g !== void 0 ? _g : []), true), (Array.isArray(metadataSource === null || metadataSource === void 0 ? void 0 : metadataSource[TAGS_KEY]) ? ensureStringArray(metadataSource[TAGS_KEY]) : []), true);
                    tags = uniqueStrings(tagCandidates);
                    conversationExtra = sanitizeExtras(metadataSource, [
                        SUBJECT_KEY,
                        TAGS_KEY,
                        READ_BY_KEY,
                        "receiverId",
                        "replyToId",
                        "attachments",
                        LEGACY_KEY,
                    ]);
                    messageExtra = sanitizeExtras(metadataSource, [
                        SUBJECT_KEY,
                        TAGS_KEY,
                        READ_BY_KEY,
                        "receiverId",
                        "replyToId",
                        "attachments",
                        LEGACY_KEY,
                    ]);
                    if (!conversationId) return [3 /*break*/, 2];
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.findUnique({
                            where: { id: conversationId },
                            select: { id: true },
                        })];
                case 1:
                    conversation = _o.sent();
                    if (!conversation) {
                        throw new Error("Conversation not found");
                    }
                    conversationIdToUse = conversation.id;
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, resolveOrganizationId(senderId)];
                case 3:
                    if (!((_h = (_o.sent())) !== null && _h !== void 0)) return [3 /*break*/, 4];
                    _a = _h;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, resolveOrganizationId(receiverId)];
                case 5:
                    _a = (_o.sent());
                    _o.label = 6;
                case 6:
                    organizationId = _a;
                    return [4 /*yield*/, createConversation({
                            organizationId: organizationId,
                            createdById: senderId,
                            participants: participants,
                            subject: normalizedSubject,
                            tags: tags,
                            metadata: conversationExtra,
                        })];
                case 7:
                    conversation = _o.sent();
                    conversationIdToUse = conversation.id;
                    _o.label = 8;
                case 8: return [4 /*yield*/, mergeConversationParticipants(conversationIdToUse, participants)];
                case 9:
                    _o.sent();
                    if (!(normalizedSubject || tags.length || (conversationExtra && Object.keys(conversationExtra).length))) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.findUnique({
                            where: { id: conversationIdToUse },
                            select: { metadata: true },
                        })];
                case 10:
                    existing = _o.sent();
                    conversationMetadata = conversationMetadataFrom((_j = existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _j !== void 0 ? _j : null);
                    metadataChanged = false;
                    if (normalizedSubject && conversationMetadata.subject !== normalizedSubject) {
                        conversationMetadata = __assign(__assign({}, conversationMetadata), { subject: normalizedSubject });
                        metadataChanged = true;
                    }
                    if (tags.length) {
                        mergedTags = Array.from(new Set(__spreadArray(__spreadArray([], ((_k = conversationMetadata.tags) !== null && _k !== void 0 ? _k : []), true), tags, true)));
                        if (JSON.stringify(mergedTags) !== JSON.stringify((_l = conversationMetadata.tags) !== null && _l !== void 0 ? _l : [])) {
                            conversationMetadata = __assign(__assign({}, conversationMetadata), { tags: mergedTags });
                            metadataChanged = true;
                        }
                    }
                    if (conversationExtra && Object.keys(conversationExtra).length) {
                        conversationMetadata = __assign(__assign({}, conversationMetadata), { extra: __assign(__assign({}, ((_m = conversationMetadata.extra) !== null && _m !== void 0 ? _m : {})), conversationExtra) });
                        metadataChanged = true;
                    }
                    if (!metadataChanged) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma_js_1.prisma.conversation.update({
                            where: { id: conversationIdToUse },
                            data: { metadata: serializeConversationMetadata(conversationMetadata) },
                        })];
                case 11:
                    _o.sent();
                    _o.label = 12;
                case 12:
                    messageMetadata = {
                        subject: normalizedSubject,
                        receiverId: receiverId,
                        replyToId: replyToId,
                        attachments: attachments,
                        readBy: [senderId],
                        legacy: metadataLegacy,
                        extra: messageExtra,
                    };
                    return [2 /*return*/, addMessage({
                            conversationId: conversationIdToUse,
                            authorId: senderId,
                            role: "user",
                            content: {
                                body: input.body,
                            },
                            metadata: messageMetadata,
                        })];
            }
        });
    });
}
function getMessages(userId, filters) {
    return __awaiter(this, void 0, void 0, function () {
        var conversationIds, _a, messages;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(filters === null || filters === void 0 ? void 0 : filters.threadId)) return [3 /*break*/, 1];
                    _a = [filters.threadId];
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, findConversationIds(userId)];
                case 2:
                    _a = _b.sent();
                    _b.label = 3;
                case 3:
                    conversationIds = _a;
                    if (conversationIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.message.findMany({
                            where: { conversationId: { in: conversationIds } },
                            orderBy: { createdAt: "desc" },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        })];
                case 4:
                    messages = _b.sent();
                    if (!(filters === null || filters === void 0 ? void 0 : filters.unreadOnly)) {
                        return [2 /*return*/, messages];
                    }
                    return [2 /*return*/, messages.filter(function (message) { return message.authorId !== userId && !hasRead(message.metadata, userId); })];
            }
        });
    });
}
function getMessageById(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var message, participants;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.message.findUnique({
                        where: { id: messageId },
                        include: {
                            conversation: {
                                select: {
                                    metadata: true,
                                },
                            },
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    })];
                case 1:
                    message = _c.sent();
                    if (!message) {
                        throw new Error("Message not found");
                    }
                    participants = participantsFromMetadata((_b = (_a = message.conversation) === null || _a === void 0 ? void 0 : _a.metadata) !== null && _b !== void 0 ? _b : null);
                    if (participants.length && !participants.includes(userId) && message.authorId !== userId) {
                        throw new Error("Unauthorized");
                    }
                    return [2 /*return*/, message];
            }
        });
    });
}
function markMessageAsRead(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var message, parsedMetadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.message.findUnique({
                        where: { id: messageId },
                    })];
                case 1:
                    message = _a.sent();
                    if (!message) {
                        throw new Error("Message not found");
                    }
                    parsedMetadata = messageMetadataFrom(message.metadata);
                    if (parsedMetadata.readBy.includes(userId)) {
                        return [2 /*return*/, message];
                    }
                    parsedMetadata.readBy = Array.from(new Set(__spreadArray(__spreadArray([], parsedMetadata.readBy, true), [userId], false)));
                    return [2 /*return*/, prisma_js_1.prisma.message.update({
                            where: { id: messageId },
                            data: { metadata: serializeMessageMetadata(parsedMetadata) },
                        })];
            }
        });
    });
}
function markThreadAsRead(conversationId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var messages, updated, _i, messages_1, message, metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.message.findMany({
                        where: { conversationId: conversationId },
                        select: { id: true, authorId: true, metadata: true },
                    })];
                case 1:
                    messages = _a.sent();
                    updated = 0;
                    _i = 0, messages_1 = messages;
                    _a.label = 2;
                case 2:
                    if (!(_i < messages_1.length)) return [3 /*break*/, 5];
                    message = messages_1[_i];
                    if (message.authorId === userId || hasRead(message.metadata, userId)) {
                        return [3 /*break*/, 4];
                    }
                    metadata = messageMetadataFrom(message.metadata);
                    metadata.readBy = Array.from(new Set(__spreadArray(__spreadArray([], metadata.readBy, true), [userId], false)));
                    return [4 /*yield*/, prisma_js_1.prisma.message.update({
                            where: { id: message.id },
                            data: { metadata: serializeMessageMetadata(metadata) },
                        })];
                case 3:
                    _a.sent();
                    updated += 1;
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true, count: updated }];
            }
        });
    });
}
function deleteMessage(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.message.findUnique({
                        where: { id: messageId },
                        select: { id: true, authorId: true },
                    })];
                case 1:
                    message = _a.sent();
                    if (!message) {
                        throw new Error("Message not found");
                    }
                    if (message.authorId !== userId) {
                        throw new Error("Unauthorized");
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.message.delete({ where: { id: messageId } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
function getUnreadCount(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var conversationIds, messages, count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, findConversationIds(userId)];
                case 1:
                    conversationIds = _a.sent();
                    if (conversationIds.length === 0) {
                        return [2 /*return*/, { count: 0 }];
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.message.findMany({
                            where: { conversationId: { in: conversationIds } },
                            select: { authorId: true, metadata: true },
                        })];
                case 2:
                    messages = _a.sent();
                    count = messages.filter(function (message) { return message.authorId !== userId && !hasRead(message.metadata, userId); }).length;
                    return [2 /*return*/, { count: count }];
            }
        });
    });
}
function getThreads(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var conversationIds, _a, conversations, messages, unreadByConversation, _i, messages_2, message;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, findConversationIds(userId)];
                case 1:
                    conversationIds = _c.sent();
                    if (conversationIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, Promise.all([
                            prisma_js_1.prisma.conversation.findMany({
                                where: { id: { in: conversationIds } },
                                orderBy: { updatedAt: "desc" },
                            }),
                            prisma_js_1.prisma.message.findMany({
                                where: { conversationId: { in: conversationIds } },
                                select: { conversationId: true, authorId: true, metadata: true },
                            }),
                        ])];
                case 2:
                    _a = _c.sent(), conversations = _a[0], messages = _a[1];
                    unreadByConversation = new Map();
                    for (_i = 0, messages_2 = messages; _i < messages_2.length; _i++) {
                        message = messages_2[_i];
                        if (message.authorId === userId) {
                            continue;
                        }
                        if (hasRead(message.metadata, userId)) {
                            continue;
                        }
                        unreadByConversation.set(message.conversationId, ((_b = unreadByConversation.get(message.conversationId)) !== null && _b !== void 0 ? _b : 0) + 1);
                    }
                    return [2 /*return*/, conversations.map(function (conversation) {
                            var _a;
                            return ({
                                id: conversation.id,
                                title: conversation.title,
                                metadata: conversation.metadata,
                                participants: participantsFromMetadata(conversation.metadata),
                                unreadCount: (_a = unreadByConversation.get(conversation.id)) !== null && _a !== void 0 ? _a : 0,
                            });
                        })];
            }
        });
    });
}
