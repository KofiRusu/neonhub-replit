"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.parseBrandVoiceDocument = parseBrandVoiceDocument;
exports.generateBrandVoiceEmbedding = generateBrandVoiceEmbedding;
exports.storeBrandVoice = storeBrandVoice;
exports.searchSimilarBrandVoice = searchSimilarBrandVoice;
exports.ingestBrandVoice = ingestBrandVoice;
exports.listBrandVoiceGuides = listBrandVoiceGuides;
exports.deleteBrandVoiceGuide = deleteBrandVoiceGuide;
var prisma_js_1 = require("../lib/prisma.js");
var openai_js_1 = require("../lib/openai.js");
var logger_js_1 = require("../lib/logger.js");
var EMBEDDING_MODEL = "text-embedding-3-small";
var EMBEDDING_DIMENSIONS = 1536;
var MAX_CHUNK_SIZE = 8000; // tokens (conservative for embeddings)
/**
 * Parse brand voice document content into structured metadata
 */
function parseBrandVoiceDocument(content) {
    return __awaiter(this, void 0, void 0, function () {
        var systemPrompt, response, parsed, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    logger_js_1.logger.info("[brand-voice-ingestion] Parsing brand voice document");
                    systemPrompt = "You are an expert at analyzing brand voice guidelines. Extract the following information from the provided brand voice document:\n\n1. Tone descriptors (e.g., professional, friendly, witty, authoritative)\n2. Key vocabulary terms that define the brand voice\n3. DO examples (phrases or approaches to use)\n4. DON'T examples (phrases or approaches to avoid)\n5. A concise summary of the overall brand voice\n\nReturn the response as a JSON object with the following structure:\n{\n  \"summary\": \"string\",\n  \"tone\": [\"array\", \"of\", \"strings\"],\n  \"vocabulary\": [\"array\", \"of\", \"key\", \"terms\"],\n  \"doExamples\": [\"array\", \"of\", \"positive\", \"examples\"],\n  \"dontExamples\": [\"array\", \"of\", \"negative\", \"examples\"]\n}";
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openai_js_1.openai.chat.completions.create({
                            model: "gpt-4o-mini",
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: "Brand Voice Document:\n\n".concat(content.slice(0, 12000)) },
                            ],
                            response_format: { type: "json_object" },
                            temperature: 0.3,
                        })];
                case 2:
                    response = _e.sent();
                    parsed = JSON.parse((_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : "{}");
                    return [2 /*return*/, {
                            summary: (_d = parsed.summary) !== null && _d !== void 0 ? _d : "Brand voice guidelines",
                            tone: Array.isArray(parsed.tone) ? parsed.tone : [],
                            vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
                            doExamples: Array.isArray(parsed.doExamples) ? parsed.doExamples : [],
                            dontExamples: Array.isArray(parsed.dontExamples) ? parsed.dontExamples : [],
                            fullText: content,
                        }];
                case 3:
                    error_1 = _e.sent();
                    logger_js_1.logger.error("[brand-voice-ingestion] Failed to parse document", error_1 instanceof Error ? error_1.message : String(error_1));
                    // Fallback: basic parsing
                    return [2 /*return*/, {
                            summary: "Brand voice guidelines",
                            tone: extractToneFromText(content),
                            vocabulary: [],
                            doExamples: [],
                            dontExamples: [],
                            fullText: content,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate embedding vector for brand voice content
 */
function generateBrandVoiceEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var response, embedding, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger_js_1.logger.info("[brand-voice-ingestion] Generating embedding");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openai_js_1.openai.embeddings.create({
                            model: EMBEDDING_MODEL,
                            input: text.slice(0, MAX_CHUNK_SIZE),
                        })];
                case 2:
                    response = _c.sent();
                    embedding = (_b = (_a = response.data[0]) === null || _a === void 0 ? void 0 : _a.embedding) !== null && _b !== void 0 ? _b : [];
                    if (embedding.length !== EMBEDDING_DIMENSIONS) {
                        throw new Error("Expected ".concat(EMBEDDING_DIMENSIONS, " dimensions, got ").concat(embedding.length));
                    }
                    return [2 /*return*/, embedding];
                case 3:
                    error_2 = _c.sent();
                    logger_js_1.logger.error("[brand-voice-ingestion] Failed to generate embedding", error_2 instanceof Error ? error_2.message : String(error_2));
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Store brand voice guide in database with vector embedding
 */
function storeBrandVoice(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var embeddingText, embedding, styleRulesJson, embeddingSpace, brandVoice;
        var brandId = _b.brandId, organizationId = _b.organizationId, document = _b.document, parsed = _b.parsed;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger_js_1.logger.info("[brand-voice-ingestion] Storing brand voice for brand: ".concat(brandId));
                    embeddingText = __spreadArray(__spreadArray([
                        parsed.summary
                    ], parsed.doExamples.slice(0, 3), true), parsed.tone.slice(0, 5), true).join("\n");
                    return [4 /*yield*/, generateBrandVoiceEmbedding(embeddingText)];
                case 1:
                    embedding = _c.sent();
                    styleRulesJson = {
                        filename: document.filename,
                        mimeType: document.mimeType,
                        tone: parsed.tone,
                        vocabulary: parsed.vocabulary,
                        doExamples: parsed.doExamples,
                        dontExamples: parsed.dontExamples,
                        parsedAt: new Date().toISOString(),
                    };
                    return [4 /*yield*/, prisma_js_1.prisma.embeddingSpace.upsert({
                            where: {
                                organizationId_name: {
                                    organizationId: organizationId,
                                    name: "brand-voice-".concat(brandId),
                                }
                            },
                            update: {},
                            create: {
                                name: "brand-voice-".concat(brandId),
                                organizationId: organizationId,
                                provider: "openai",
                                model: EMBEDDING_MODEL,
                                dimension: 1536,
                            },
                        })];
                case 2:
                    embeddingSpace = _c.sent();
                    return [4 /*yield*/, prisma_js_1.prisma.brandVoice.create({
                            data: {
                                brandId: brandId,
                                embeddingSpaceId: embeddingSpace.id,
                                promptTemplate: parsed.summary,
                                styleRulesJson: styleRulesJson,
                                // Note: Embedding will be attached separately via raw SQL
                                // due to Prisma's limited support for vector types
                            },
                        })];
                case 3:
                    brandVoice = _c.sent();
                    // Attach vector embedding using raw SQL
                    return [4 /*yield*/, prisma_js_1.prisma.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    UPDATE \"brand_voices\"\n    SET \"embedding\" = ", "::vector\n    WHERE id = ", "\n  "], ["\n    UPDATE \"brand_voices\"\n    SET \"embedding\" = ", "::vector\n    WHERE id = ", "\n  "])), embedding, brandVoice.id)];
                case 4:
                    // Attach vector embedding using raw SQL
                    _c.sent();
                    logger_js_1.logger.info("[brand-voice-ingestion] Brand voice stored with ID: ".concat(brandVoice.id));
                    return [2 /*return*/, {
                            id: brandVoice.id,
                            brandVoiceId: brandVoice.id,
                        }];
            }
        });
    });
}
/**
 * Search for similar brand voice examples using vector similarity
 */
function searchSimilarBrandVoice(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var queryEmbedding, results;
        var brandId = _b.brandId, query = _b.query, _c = _b.limit, limit = _c === void 0 ? 5 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    logger_js_1.logger.info("[brand-voice-ingestion] Searching similar brand voice for brand: ".concat(brandId, ", query: ").concat(query.slice(0, 50)));
                    return [4 /*yield*/, generateBrandVoiceEmbedding(query)];
                case 1:
                    queryEmbedding = _d.sent();
                    return [4 /*yield*/, prisma_js_1.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    SELECT \n      id,\n      \"promptTemplate\",\n      \"styleRulesJson\",\n      1 - (embedding <=> ", "::vector) AS similarity\n    FROM \"brand_voices\"\n    WHERE \"brandId\" = ", "\n    ORDER BY embedding <=> ", "::vector\n    LIMIT ", "\n  "], ["\n    SELECT \n      id,\n      \"promptTemplate\",\n      \"styleRulesJson\",\n      1 - (embedding <=> ", "::vector) AS similarity\n    FROM \"brand_voices\"\n    WHERE \"brandId\" = ", "\n    ORDER BY embedding <=> ", "::vector\n    LIMIT ", "\n  "])), queryEmbedding, brandId, queryEmbedding, limit)];
                case 2:
                    results = _d.sent();
                    // Map to expected return type
                    return [2 /*return*/, results.map(function (r) { return ({
                            id: r.id,
                            summary: r.promptTemplate,
                            metadata: r.styleRulesJson,
                            similarity: r.similarity,
                        }); })];
            }
        });
    });
}
/**
 * Ingest brand voice document: parse, embed, and store
 */
function ingestBrandVoice(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var parsed, brandVoiceId;
        var brandId = _b.brandId, organizationId = _b.organizationId, document = _b.document;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger_js_1.logger.info("[brand-voice-ingestion] Starting ingestion for brand: ".concat(brandId, ", file: ").concat(document.filename));
                    return [4 /*yield*/, parseBrandVoiceDocument(document.content)];
                case 1:
                    parsed = _c.sent();
                    return [4 /*yield*/, storeBrandVoice({
                            brandId: brandId,
                            organizationId: organizationId,
                            document: document,
                            parsed: parsed,
                        })];
                case 2:
                    brandVoiceId = (_c.sent()).brandVoiceId;
                    logger_js_1.logger.info("[brand-voice-ingestion] Ingestion complete, ID: ".concat(brandVoiceId));
                    return [2 /*return*/, { brandVoiceId: brandVoiceId, parsed: parsed }];
            }
        });
    });
}
// Helper: Extract tone descriptors from text (fallback)
function extractToneFromText(text) {
    var toneKeywords = [
        "professional",
        "friendly",
        "casual",
        "formal",
        "witty",
        "humorous",
        "authoritative",
        "conversational",
        "technical",
        "approachable",
        "confident",
        "empathetic",
    ];
    var lowerText = text.toLowerCase();
    return toneKeywords.filter(function (keyword) { return lowerText.includes(keyword); });
}
/**
 * List all brand voice guides for a brand
 */
function listBrandVoiceGuides(brandId) {
    return __awaiter(this, void 0, void 0, function () {
        var voices;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.brandVoice.findMany({
                        where: { brandId: brandId },
                        select: {
                            id: true,
                            promptTemplate: true,
                            styleRulesJson: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: "desc" },
                    })];
                case 1:
                    voices = _a.sent();
                    // Map to expected return type
                    return [2 /*return*/, voices.map(function (v) { return ({
                            id: v.id,
                            summary: v.promptTemplate,
                            metadata: v.styleRulesJson,
                            createdAt: v.createdAt,
                        }); })];
            }
        });
    });
}
/**
 * Delete brand voice guide
 */
function deleteBrandVoiceGuide(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.brandVoice.delete({
                        where: { id: id },
                    })];
                case 1:
                    _a.sent();
                    logger_js_1.logger.info("[brand-voice-ingestion] Brand voice deleted, ID: ".concat(id));
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
