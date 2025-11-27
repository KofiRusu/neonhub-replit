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
exports.createDocument = createDocument;
exports.getDocuments = getDocuments;
exports.getDocumentById = getDocumentById;
exports.updateDocument = updateDocument;
exports.createDocumentVersion = createDocumentVersion;
exports.deleteDocument = deleteDocument;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var TYPE_KEY = "type";
var TAGS_KEY = "tags";
var VERSION_KEY = "version";
var PREVIOUS_KEY = "previousDocumentId";
var toRecord = function (value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return __assign({}, value);
};
var mergeMetadata = function (existing, updates) {
    var base = toRecord(existing);
    for (var _i = 0, _a = Object.entries(updates); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value === undefined) {
            continue;
        }
        if (value === null) {
            delete base[key];
            continue;
        }
        base[key] = value;
    }
    return Object.keys(base).length ? base : undefined;
};
function resolveOrganizationId(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var membership;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.organizationMembership.findFirst({
                        where: { userId: userId },
                        select: { organizationId: true },
                    })];
                case 1:
                    membership = _a.sent();
                    if (!membership) {
                        throw new Error("Organization context not found");
                    }
                    return [2 /*return*/, membership.organizationId];
            }
        });
    });
}
function createDocument(userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var organizationId, metadataPayload, metadata, document_1, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, resolveOrganizationId(userId)];
                case 1:
                    organizationId = _b.sent();
                    metadataPayload = __assign({}, ((_a = input.metadata) !== null && _a !== void 0 ? _a : {}));
                    if (input.type) {
                        metadataPayload[TYPE_KEY] = input.type;
                    }
                    if (input.tags) {
                        metadataPayload[TAGS_KEY] = input.tags;
                    }
                    metadataPayload[VERSION_KEY] = 1;
                    metadata = mergeMetadata(null, metadataPayload);
                    return [4 /*yield*/, prisma_js_1.prisma.document.create({
                            data: __assign(__assign(__assign({ title: input.title, content: input.content }, (input.status ? { status: input.status } : {})), (metadata ? { metadata: metadata } : {})), { owner: {
                                    connect: { id: userId },
                                }, organization: {
                                    connect: { id: organizationId },
                                } }),
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    document_1 = _b.sent();
                    logger_js_1.logger.info({ documentId: document_1.id, userId: userId }, "Document created");
                    return [2 /*return*/, document_1];
                case 3:
                    error_1 = _b.sent();
                    logger_js_1.logger.error({ error: error_1, userId: userId }, "Failed to create document");
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getDocuments(userId, filters) {
    return __awaiter(this, void 0, void 0, function () {
        var where, documents, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    where = __assign(__assign({ ownerId: userId }, ((filters === null || filters === void 0 ? void 0 : filters.status) ? { status: filters.status } : {})), ((filters === null || filters === void 0 ? void 0 : filters.type)
                        ? {
                            metadata: {
                                path: [TYPE_KEY],
                                equals: filters.type,
                            },
                        }
                        : {}));
                    return [4 /*yield*/, prisma_js_1.prisma.document.findMany({
                            where: where,
                            orderBy: { updatedAt: "desc" },
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    documents = _a.sent();
                    return [2 /*return*/, documents];
                case 2:
                    error_2 = _a.sent();
                    logger_js_1.logger.error({ error: error_2, userId: userId }, "Failed to fetch documents");
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getDocumentById(documentId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var document_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.document.findFirst({
                            where: {
                                id: documentId,
                                ownerId: userId,
                            },
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    document_2 = _a.sent();
                    if (!document_2) {
                        throw new Error("Document not found");
                    }
                    return [2 /*return*/, document_2];
                case 2:
                    error_3 = _a.sent();
                    logger_js_1.logger.error({ error: error_3, documentId: documentId, userId: userId }, "Failed to fetch document");
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateDocument(documentId, userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, metadataUpdates, metadata, document_3, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.document.findFirst({
                            where: {
                                id: documentId,
                                ownerId: userId,
                            },
                        })];
                case 1:
                    existing = _b.sent();
                    if (!existing) {
                        throw new Error("Document not found");
                    }
                    metadataUpdates = __assign({}, ((_a = input.metadata) !== null && _a !== void 0 ? _a : {}));
                    if (input.type !== undefined) {
                        metadataUpdates[TYPE_KEY] = input.type;
                    }
                    if (input.tags !== undefined) {
                        metadataUpdates[TAGS_KEY] = input.tags;
                    }
                    metadata = mergeMetadata(existing.metadata, metadataUpdates);
                    return [4 /*yield*/, prisma_js_1.prisma.document.update({
                            where: { id: documentId },
                            data: __assign(__assign(__assign(__assign({}, (input.title ? { title: input.title } : {})), (input.content ? { content: input.content } : {})), (input.status ? { status: input.status } : {})), (metadata !== undefined ? { metadata: metadata } : {})),
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    document_3 = _b.sent();
                    logger_js_1.logger.info({ documentId: documentId, userId: userId }, "Document updated");
                    return [2 /*return*/, document_3];
                case 3:
                    error_4 = _b.sent();
                    logger_js_1.logger.error({ error: error_4, documentId: documentId, userId: userId }, "Failed to update document");
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createDocumentVersion(documentId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var original, originalMetadata, currentVersion, newMetadata, newVersion, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.document.findFirst({
                            where: {
                                id: documentId,
                                ownerId: userId,
                            },
                        })];
                case 1:
                    original = _b.sent();
                    if (!original) {
                        throw new Error("Document not found");
                    }
                    originalMetadata = toRecord(original.metadata);
                    currentVersion = typeof originalMetadata[VERSION_KEY] === "number" ? originalMetadata[VERSION_KEY] : 1;
                    newMetadata = __assign(__assign({}, originalMetadata), (_a = {}, _a[VERSION_KEY] = currentVersion + 1, _a[PREVIOUS_KEY] = documentId, _a));
                    return [4 /*yield*/, prisma_js_1.prisma.document.create({
                            data: {
                                title: "".concat(original.title, " (v").concat(currentVersion + 1, ")"),
                                content: original.content,
                                status: "draft",
                                metadata: newMetadata,
                                owner: {
                                    connect: { id: userId },
                                },
                                organization: {
                                    connect: { id: original.organizationId },
                                },
                            },
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    newVersion = _b.sent();
                    logger_js_1.logger.info({ documentId: documentId, newVersionId: newVersion.id, userId: userId }, "Document version created");
                    return [2 /*return*/, newVersion];
                case 3:
                    error_5 = _b.sent();
                    logger_js_1.logger.error({ error: error_5, documentId: documentId, userId: userId }, "Failed to create document version");
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function deleteDocument(documentId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var document_4, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.document.findFirst({
                            where: {
                                id: documentId,
                                ownerId: userId,
                            },
                        })];
                case 1:
                    document_4 = _a.sent();
                    if (!document_4) {
                        throw new Error("Document not found");
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.document.delete({
                            where: { id: documentId },
                        })];
                case 2:
                    _a.sent();
                    logger_js_1.logger.info({ documentId: documentId, userId: userId }, "Document deleted");
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_6 = _a.sent();
                    logger_js_1.logger.error({ error: error_6, documentId: documentId, userId: userId }, "Failed to delete document");
                    throw error_6;
                case 4: return [2 /*return*/];
            }
        });
    });
}
