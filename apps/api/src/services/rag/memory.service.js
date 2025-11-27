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
exports.MemoryRagService = void 0;
var client_1 = require("@prisma/client");
var prisma_js_1 = require("../../db/prisma.js");
var embeddings_js_1 = require("../../ai/embeddings.js");
var vector_utils_js_1 = require("./vector-utils.js");
var MemoryRagService = /** @class */ (function () {
    function MemoryRagService(db) {
        if (db === void 0) { db = prisma_js_1.prisma; }
        this.db = db;
    }
    MemoryRagService.prototype.storeSnippet = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var embedding, record, vectorLiteral;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, (0, embeddings_js_1.embedText)(input.text)];
                    case 1:
                        embedding = _e.sent();
                        return [4 /*yield*/, this.db.memEmbedding.create({
                                data: {
                                    organizationId: input.organizationId,
                                    personId: input.personId,
                                    label: (_a = input.label) !== null && _a !== void 0 ? _a : null,
                                    metadata: __assign(__assign({}, ((_b = input.metadata) !== null && _b !== void 0 ? _b : {})), (input.category ? { category: input.category } : {})),
                                    expiresAt: (_c = input.expiresAt) !== null && _c !== void 0 ? _c : undefined,
                                    sourceEventId: (_d = input.sourceEventId) !== null && _d !== void 0 ? _d : undefined,
                                },
                            })];
                    case 2:
                        record = _e.sent();
                        vectorLiteral = (0, vector_utils_js_1.toVectorSql)(embedding);
                        return [4 /*yield*/, this.db.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      UPDATE \"mem_embeddings\"\n      SET \"embedding\" = ", "\n      WHERE id = ", "\n    "], ["\n      UPDATE \"mem_embeddings\"\n      SET \"embedding\" = ", "\n      WHERE id = ", "\n    "])), vectorLiteral, record.id)];
                    case 3:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MemoryRagService.prototype.searchSnippets = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var embedding, filters, whereClause, vectorLiteral, query, rows;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, embeddings_js_1.embedText)(input.query)];
                    case 1:
                        embedding = _b.sent();
                        if (!embedding.length) {
                            return [2 /*return*/, []];
                        }
                        filters = [client_1.Prisma.sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\"organizationId\" = ", ""], ["\"organizationId\" = ", ""])), input.organizationId)];
                        if (input.personId) {
                            filters.push(client_1.Prisma.sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\"personId\" = ", ""], ["\"personId\" = ", ""])), input.personId));
                        }
                        if (input.category) {
                            filters.push(client_1.Prisma.sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["metadata ->> 'category' = ", ""], ["metadata ->> 'category' = ", ""])), input.category));
                        }
                        whereClause = filters.length
                            ? client_1.Prisma.sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["WHERE ", ""], ["WHERE ", ""])), client_1.Prisma.join(filters, " AND ")) : client_1.Prisma.sql(templateObject_6 || (templateObject_6 = __makeTemplateObject([""], [""])));
                        vectorLiteral = (0, vector_utils_js_1.toVectorSql)(embedding);
                        query = client_1.Prisma.sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n      SELECT id, label, metadata, 1 - (embedding <=> ", ") AS similarity\n      FROM \"mem_embeddings\"\n      ", "\n      ORDER BY embedding <=> ", "\n      LIMIT ", "\n    "], ["\n      SELECT id, label, metadata, 1 - (embedding <=> ", ") AS similarity\n      FROM \"mem_embeddings\"\n      ", "\n      ORDER BY embedding <=> ", "\n      LIMIT ", "\n    "])), client_1.Prisma.raw(vectorLiteral), whereClause, client_1.Prisma.raw(vectorLiteral), (_a = input.limit) !== null && _a !== void 0 ? _a : 5);
                        return [4 /*yield*/, this.db.$queryRaw(query)];
                    case 2:
                        rows = _b.sent();
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    return MemoryRagService;
}());
exports.MemoryRagService = MemoryRagService;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
