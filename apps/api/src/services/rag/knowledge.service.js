"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.KnowledgeBaseService = void 0;
var prisma_js_1 = require("../../db/prisma.js");
var embeddings_js_1 = require("../../ai/embeddings.js");
var vector_utils_js_1 = require("./vector-utils.js");
var DEFAULT_EMBEDDING_SPACE_NAME = "org-rag-space";
function chunkText(input, chunkSize) {
    if (chunkSize === void 0) { chunkSize = 600; }
    var normalized = input.replace(/\r\n/g, "\n").trim();
    if (!normalized)
        return [];
    var paragraphs = normalized.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
    var chunks = [];
    for (var _i = 0, paragraphs_1 = paragraphs; _i < paragraphs_1.length; _i++) {
        var paragraph = paragraphs_1[_i];
        if (paragraph.length <= chunkSize) {
            chunks.push(paragraph);
            continue;
        }
        for (var i = 0; i < paragraph.length; i += chunkSize) {
            chunks.push(paragraph.slice(i, i + chunkSize));
        }
    }
    return chunks;
}
var KnowledgeBaseService = /** @class */ (function () {
    function KnowledgeBaseService(db) {
        if (db === void 0) { db = prisma_js_1.prisma; }
        this.db = db;
    }
    KnowledgeBaseService.prototype.ensureEmbeddingSpace = function (organizationId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.embeddingSpace.findFirst({
                            where: { organizationId: organizationId, name: DEFAULT_EMBEDDING_SPACE_NAME },
                            select: { id: true },
                        })];
                    case 1:
                        existing = _a.sent();
                        if (existing)
                            return [2 /*return*/, existing.id];
                        return [4 /*yield*/, this.db.embeddingSpace.create({
                                data: {
                                    organizationId: organizationId,
                                    name: DEFAULT_EMBEDDING_SPACE_NAME,
                                    provider: "openai",
                                    model: "text-embedding-3-small",
                                    dimension: 1536,
                                },
                            })];
                    case 2:
                        created = _a.sent();
                        return [2 /*return*/, created.id];
                }
            });
        });
    };
    KnowledgeBaseService.prototype.ensureDataset = function (organizationId, slug, name, embeddingSpaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.dataset.findFirst({
                            where: { organizationId: organizationId, slug: slug },
                            select: { id: true, embeddingSpaceId: true },
                        })];
                    case 1:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 4];
                        if (!!existing.embeddingSpaceId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.db.dataset.update({
                                where: { id: existing.id },
                                data: { embeddingSpaceId: embeddingSpaceId },
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, existing.id];
                    case 4: return [4 /*yield*/, this.db.dataset.create({
                            data: {
                                organization: { connect: { id: organizationId } },
                                slug: slug,
                                name: name,
                                kind: "documents",
                                embeddingSpace: { connect: { id: embeddingSpaceId } },
                            },
                        })];
                    case 5:
                        created = _a.sent();
                        return [2 /*return*/, created.id];
                }
            });
        });
    };
    KnowledgeBaseService.prototype.ingestSnippet = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, embeddingSpaceId, datasetId, document, index, _i, chunks_1, chunk, embedding, record, vectorLiteral;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        chunks = chunkText(input.content);
                        if (!chunks.length)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.ensureEmbeddingSpace(input.organizationId)];
                    case 1:
                        embeddingSpaceId = _e.sent();
                        return [4 /*yield*/, this.ensureDataset(input.organizationId, input.datasetSlug, input.datasetName, embeddingSpaceId)];
                    case 2:
                        datasetId = _e.sent();
                        return [4 /*yield*/, this.db.document.create({
                                data: {
                                    datasetId: datasetId,
                                    organizationId: input.organizationId,
                                    ownerId: input.ownerId,
                                    title: input.title,
                                    content: input.content,
                                    status: "published",
                                    embeddingSpaceId: embeddingSpaceId,
                                    metadata: __assign(__assign({}, ((_a = input.metadata) !== null && _a !== void 0 ? _a : {})), { tags: (_b = input.tags) !== null && _b !== void 0 ? _b : [] }),
                                },
                            })];
                    case 3:
                        document = _e.sent();
                        index = 0;
                        _i = 0, chunks_1 = chunks;
                        _e.label = 4;
                    case 4:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 9];
                        chunk = chunks_1[_i];
                        return [4 /*yield*/, (0, embeddings_js_1.embedText)(chunk)];
                    case 5:
                        embedding = _e.sent();
                        return [4 /*yield*/, this.db.chunk.create({
                                data: {
                                    datasetId: datasetId,
                                    documentId: document.id,
                                    embeddingSpaceId: embeddingSpaceId,
                                    idx: index,
                                    text: chunk,
                                    metadata: __assign(__assign({}, ((_c = input.metadata) !== null && _c !== void 0 ? _c : {})), { tags: (_d = input.tags) !== null && _d !== void 0 ? _d : [] }),
                                },
                            })];
                    case 6:
                        record = _e.sent();
                        vectorLiteral = (0, vector_utils_js_1.toVectorSql)(embedding);
                        return [4 /*yield*/, this.db.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        UPDATE \"chunks\"\n        SET \"embedding\" = ", "\n        WHERE id = ", "\n      "], ["\n        UPDATE \"chunks\"\n        SET \"embedding\" = ", "\n        WHERE id = ", "\n      "])), vectorLiteral, record.id)];
                    case 7:
                        _e.sent();
                        index += 1;
                        _e.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 4];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    KnowledgeBaseService.prototype.retrieveSnippets = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var dataset, embedding, vectorLiteral, rows;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.dataset.findFirst({
                            where: {
                                organizationId: input.organizationId,
                                slug: input.datasetSlug,
                            },
                            select: { id: true },
                        })];
                    case 1:
                        dataset = _b.sent();
                        if (!dataset) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, (0, embeddings_js_1.embedText)(input.query)];
                    case 2:
                        embedding = _b.sent();
                        if (!embedding.length) {
                            return [2 /*return*/, []];
                        }
                        vectorLiteral = (0, vector_utils_js_1.toVectorSql)(embedding);
                        return [4 /*yield*/, this.db.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT c.id, c.text, c.metadata, d.title, 1 - (c.embedding <=> ", ") AS similarity\n      FROM \"chunks\" c\n      JOIN \"documents\" d ON d.id = c.\"documentId\"\n      WHERE c.\"datasetId\" = ", "\n      ORDER BY c.embedding <=> ", "\n      LIMIT ", "\n    "], ["\n      SELECT c.id, c.text, c.metadata, d.title, 1 - (c.embedding <=> ", ") AS similarity\n      FROM \"chunks\" c\n      JOIN \"documents\" d ON d.id = c.\"documentId\"\n      WHERE c.\"datasetId\" = ", "\n      ORDER BY c.embedding <=> ", "\n      LIMIT ", "\n    "])), vectorLiteral, dataset.id, vectorLiteral, (_a = input.limit) !== null && _a !== void 0 ? _a : 5)];
                    case 3:
                        rows = _b.sent();
                        return [2 /*return*/, rows.map(function (row) { return ({
                                id: row.id,
                                text: row.text,
                                metadata: row.metadata,
                                similarity: row.similarity,
                                title: row.title,
                            }); })];
                }
            });
        });
    };
    return KnowledgeBaseService;
}());
exports.KnowledgeBaseService = KnowledgeBaseService;
var templateObject_1, templateObject_2;
