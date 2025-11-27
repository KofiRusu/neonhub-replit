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
exports.isOpenAIConfigured = exports.openai = exports.generateText = void 0;
var openai_1 = require("openai");
var env_js_1 = require("../config/env.js");
var logger_js_1 = require("./logger.js");
var openai_js_1 = require("../ai/openai.js");
Object.defineProperty(exports, "generateText", { enumerable: true, get: function () { return openai_js_1.generateText; } });
var env = (0, env_js_1.getEnv)();
var summarizeMessages = function (messages) {
    var joined = messages
        .map(function (message) { var _a; return ((_a = message.content) !== null && _a !== void 0 ? _a : ""); })
        .join("\n")
        .trim();
    return joined.slice(0, 400) || "No content provided.";
};
var createMockOpenAI = function () {
    logger_js_1.logger.warn("OPENAI_API_KEY missing. Using mock OpenAI client.");
    return {
        chat: {
            completions: {
                create: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var promptPreview, content, promptTokens, completionTokens;
                        var model = _b.model, messages = _b.messages;
                        return __generator(this, function (_c) {
                            promptPreview = summarizeMessages(messages);
                            content = "Mock response (".concat(model !== null && model !== void 0 ? model : "mock-gpt-4", "): ").concat(promptPreview);
                            promptTokens = promptPreview.length;
                            completionTokens = content.length;
                            return [2 /*return*/, {
                                    id: "mock-chat-completion",
                                    object: "chat.completion",
                                    created: Math.floor(Date.now() / 1000),
                                    model: model !== null && model !== void 0 ? model : "mock-gpt-4",
                                    choices: [
                                        {
                                            index: 0,
                                            message: {
                                                role: "assistant",
                                                content: content,
                                            },
                                            finish_reason: "stop",
                                        },
                                    ],
                                    usage: {
                                        prompt_tokens: promptTokens,
                                        completion_tokens: completionTokens,
                                        total_tokens: promptTokens + completionTokens,
                                    },
                                }];
                        });
                    });
                },
            },
        },
        embeddings: {
            create: function (_a) {
                return __awaiter(this, arguments, void 0, function (_b) {
                    var texts, data, tokenSum;
                    var model = _b.model, input = _b.input;
                    return __generator(this, function (_c) {
                        texts = Array.isArray(input) ? input : [input];
                        data = texts.map(function (text, index) { return ({
                            object: "embedding",
                            index: index,
                            embedding: Array.from({ length: 8 }, function (_, i) {
                                var seed = text.length + index + i * 7;
                                return Number(((Math.sin(seed) + 1) / 2).toFixed(6));
                            }),
                        }); });
                        tokenSum = texts.reduce(function (acc, text) { return acc + text.length; }, 0);
                        return [2 /*return*/, {
                                object: "list",
                                data: data,
                                model: model !== null && model !== void 0 ? model : "text-embedding-mock",
                                usage: {
                                    prompt_tokens: tokenSum,
                                    total_tokens: tokenSum,
                                },
                            }];
                    });
                });
            },
        },
    };
};
var client = env.OPENAI_API_KEY
    ? new openai_1.default({ apiKey: env.OPENAI_API_KEY })
    : createMockOpenAI();
exports.openai = client;
exports.isOpenAIConfigured = Boolean(env.OPENAI_API_KEY);
