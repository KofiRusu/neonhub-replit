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
exports.RagContextService = void 0;
var memory_service_js_1 = require("./memory.service.js");
var knowledge_service_js_1 = require("./knowledge.service.js");
var brand_voice_ingestion_js_1 = require("../brand-voice-ingestion.js");
var DATASET_SLUGS = {
    content: function (organizationId) { return ({ slug: "content-".concat(organizationId), name: "Content Knowledge" }); },
    seo: function (organizationId) { return ({ slug: "seo-".concat(organizationId), name: "SEO Knowledge" }); },
    support: function (organizationId) { return ({ slug: "support-".concat(organizationId), name: "Support Knowledge" }); },
    trend: function (organizationId) { return ({ slug: "trend-".concat(organizationId), name: "Trend Knowledge" }); },
    email: function (organizationId) { return ({ slug: "email-".concat(organizationId), name: "Email Knowledge" }); },
};
var RagContextService = /** @class */ (function () {
    function RagContextService(memory, knowledge) {
        if (memory === void 0) { memory = new memory_service_js_1.MemoryRagService(); }
        if (knowledge === void 0) { knowledge = new knowledge_service_js_1.KnowledgeBaseService(); }
        this.memory = memory;
        this.knowledge = knowledge;
    }
    RagContextService.prototype.build = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var categories, limit, memoryPromise, knowledgePromises, _a, memories, knowledgeResults, brandVoiceResults, _b;
            var _this = this;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        categories = ((_c = input.categories) === null || _c === void 0 ? void 0 : _c.length) ? input.categories : ["content"];
                        limit = (_d = input.limit) !== null && _d !== void 0 ? _d : 3;
                        memoryPromise = this.memory.searchSnippets({
                            organizationId: input.organizationId,
                            personId: input.personId,
                            query: input.query,
                            limit: limit,
                        });
                        knowledgePromises = categories.map(function (category) { return __awaiter(_this, void 0, void 0, function () {
                            var dataset;
                            var _a;
                            return __generator(this, function (_b) {
                                dataset = (_a = DATASET_SLUGS[category]) === null || _a === void 0 ? void 0 : _a.call(DATASET_SLUGS, input.organizationId);
                                if (!dataset)
                                    return [2 /*return*/, []];
                                return [2 /*return*/, this.knowledge.retrieveSnippets({
                                        organizationId: input.organizationId,
                                        datasetSlug: dataset.slug,
                                        query: input.query,
                                        limit: limit,
                                    })];
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(__spreadArray([memoryPromise], knowledgePromises, true))];
                    case 1:
                        _a = _e.sent(), memories = _a[0], knowledgeResults = _a.slice(1);
                        if (!input.brandId) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, brand_voice_ingestion_js_1.searchSimilarBrandVoice)({
                                brandId: input.brandId,
                                query: input.query,
                                limit: limit,
                            })];
                    case 2:
                        _b = _e.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _b = [];
                        _e.label = 4;
                    case 4:
                        brandVoiceResults = _b;
                        return [2 /*return*/, {
                                brandVoice: brandVoiceResults.map(function (item) { return ({
                                    summary: item.summary,
                                    similarity: item.similarity,
                                }); }),
                                knowledge: knowledgeResults.flat().map(function (item) { return ({
                                    text: item.text,
                                    title: item.title,
                                    similarity: item.similarity,
                                }); }),
                                memories: memories.map(function (item) { return ({
                                    label: item.label,
                                    similarity: item.similarity,
                                }); }),
                            }];
                }
            });
        });
    };
    RagContextService.prototype.formatForPrompt = function (context) {
        var sections = [];
        if (context.brandVoice.length) {
            sections.push.apply(sections, __spreadArray(["Brand voice directives:"], context.brandVoice.map(function (entry, index) { var _a; return "  (".concat(((_a = entry.similarity) !== null && _a !== void 0 ? _a : 0).toFixed(2), ") BV").concat(index + 1, ": ").concat(entry.summary); }), false));
        }
        if (context.knowledge.length) {
            sections.push.apply(sections, __spreadArray(["Knowledge base highlights:"], context.knowledge.map(function (entry, index) { return "  (".concat(entry.similarity.toFixed(2), ") KB").concat(index + 1, " [").concat(entry.title, "]: ").concat(entry.text); }), false));
        }
        if (context.memories.length) {
            sections.push.apply(sections, __spreadArray(["Recent interactions:"], context.memories.map(function (entry, index) { var _a; return "  (".concat(entry.similarity.toFixed(2), ") MEM").concat(index + 1, ": ").concat((_a = entry.label) !== null && _a !== void 0 ? _a : "untitled memory"); }), false));
        }
        return sections.join("\n");
    };
    return RagContextService;
}());
exports.RagContextService = RagContextService;
