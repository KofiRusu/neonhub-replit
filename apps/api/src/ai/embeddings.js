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
exports.embedText = embedText;
var openai_js_1 = require("../lib/openai.js");
var logger_js_1 = require("../lib/logger.js");
var DEFAULT_MODEL = "text-embedding-3-small";
var DEFAULT_DIMENSION = 1536;
function deterministicEmbedding(text, dimension) {
    if (dimension === void 0) { dimension = DEFAULT_DIMENSION; }
    var output = new Array(dimension);
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    for (var i = 0; i < dimension; i += 1) {
        var value = Math.sin(hash + i * 13);
        output[i] = Number(value.toFixed(6));
    }
    return output;
}
function embedText(text, options) {
    return __awaiter(this, void 0, void 0, function () {
        var normalized, model, response, embedding, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    normalized = (_a = text === null || text === void 0 ? void 0 : text.trim()) !== null && _a !== void 0 ? _a : "";
                    if (!normalized) {
                        return [2 /*return*/, deterministicEmbedding("empty")];
                    }
                    model = (_b = options === null || options === void 0 ? void 0 : options.model) !== null && _b !== void 0 ? _b : DEFAULT_MODEL;
                    if (!openai_js_1.isOpenAIConfigured) {
                        return [2 /*return*/, deterministicEmbedding(normalized)];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openai_js_1.openai.embeddings.create({
                            model: model,
                            input: normalized,
                        })];
                case 2:
                    response = _e.sent();
                    embedding = (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.embedding;
                    if (embedding && embedding.length) {
                        return [2 /*return*/, embedding];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _e.sent();
                    logger_js_1.logger.warn({ error: error_1 }, "Embedding request failed; falling back to deterministic vector");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, deterministicEmbedding(normalized)];
            }
        });
    });
}
