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
exports.generateText = generateText;
exports.isInMockMode = isInMockMode;
var openai_1 = require("openai");
var env_js_1 = require("../config/env.js");
var logger_js_1 = require("../lib/logger.js");
var env = (0, env_js_1.getEnv)();
var openai = null;
var isMockMode = !env.OPENAI_API_KEY;
if (!isMockMode) {
    openai = new openai_1.default({
        apiKey: env.OPENAI_API_KEY,
    });
}
else {
    logger_js_1.logger.warn("⚠️ OpenAI API key not found. Running in MOCK mode.");
}
/**
 * Generate text using OpenAI API with retry logic
 * Falls back to mock mode if API key is missing
 */
function generateText(options) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, model, _b, temperature, _c, maxTokens, _d, systemPrompt, maxRetries, lastError, _loop_1, attempt, state_1;
        var _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    prompt = options.prompt, _a = options.model, model = _a === void 0 ? env.OPENAI_MODEL || "gpt-4" : _a, _b = options.temperature, temperature = _b === void 0 ? 0.7 : _b, _c = options.maxTokens, maxTokens = _c === void 0 ? 1500 : _c, _d = options.systemPrompt, systemPrompt = _d === void 0 ? "You are a helpful AI assistant specialized in creating marketing content." : _d;
                    if (!(isMockMode || !openai)) return [3 /*break*/, 2];
                    logger_js_1.logger.info({ prompt: prompt.substring(0, 100) }, "Generating text (MOCK mode)");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 1:
                    _h.sent(); // Simulate API delay
                    return [2 /*return*/, {
                            text: generateMockContent(prompt),
                            model: "mock-gpt-4",
                            mock: true,
                        }];
                case 2:
                    maxRetries = 3;
                    lastError = null;
                    _loop_1 = function (attempt) {
                        var startTime, completion, duration, text, error_1, backoff_1;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    _j.trys.push([0, 2, , 5]);
                                    logger_js_1.logger.info({ attempt: attempt, model: model, promptLength: prompt.length }, "Calling OpenAI API");
                                    startTime = Date.now();
                                    return [4 /*yield*/, openai.chat.completions.create({
                                            model: model,
                                            messages: [
                                                { role: "system", content: systemPrompt },
                                                { role: "user", content: prompt },
                                            ],
                                            temperature: temperature,
                                            max_tokens: maxTokens,
                                        })];
                                case 1:
                                    completion = _j.sent();
                                    duration = Date.now() - startTime;
                                    text = ((_f = (_e = completion.choices[0]) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.content) || "";
                                    logger_js_1.logger.info({
                                        duration: duration,
                                        tokens: (_g = completion.usage) === null || _g === void 0 ? void 0 : _g.total_tokens,
                                        model: completion.model,
                                    }, "OpenAI API call successful");
                                    return [2 /*return*/, { value: {
                                                text: text,
                                                usage: completion.usage ? {
                                                    promptTokens: completion.usage.prompt_tokens,
                                                    completionTokens: completion.usage.completion_tokens,
                                                    totalTokens: completion.usage.total_tokens,
                                                } : undefined,
                                                model: completion.model,
                                                mock: false,
                                            } }];
                                case 2:
                                    error_1 = _j.sent();
                                    lastError = error_1;
                                    logger_js_1.logger.warn({
                                        error: lastError.message,
                                        attempt: attempt,
                                        maxRetries: maxRetries,
                                    }, "OpenAI API call failed");
                                    if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                                    backoff_1 = Math.pow(2, attempt) * 1000;
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, backoff_1); })];
                                case 3:
                                    _j.sent();
                                    _j.label = 4;
                                case 4: return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 1;
                    _h.label = 3;
                case 3:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 6];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 4:
                    state_1 = _h.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _h.label = 5;
                case 5:
                    attempt++;
                    return [3 /*break*/, 3];
                case 6:
                    // All retries failed, log error and throw
                    logger_js_1.logger.error({ error: lastError }, "OpenAI API call failed after all retries");
                    throw new Error("OpenAI API call failed: ".concat((lastError === null || lastError === void 0 ? void 0 : lastError.message) || "Unknown error"));
            }
        });
    });
}
/**
 * Generate mock content for testing/demo purposes
 */
function generateMockContent(prompt) {
    var promptLower = prompt.toLowerCase();
    if (promptLower.includes("blog") || promptLower.includes("article")) {
        return "# AI-Generated Blog Post (Mock Mode)\n\n## Introduction\nThis is a mock-generated blog post created for demonstration purposes. In production, this content would be generated by OpenAI's GPT-4 model based on your specific requirements.\n\n## Key Points\n- **Point 1**: AI-powered content generation enables rapid content creation\n- **Point 2**: Modern marketing requires consistent, high-quality content\n- **Point 3**: Automation tools can help teams scale their content efforts\n\n## Detailed Analysis\nThe use of AI in content marketing has revolutionized how businesses approach their content strategy. By leveraging advanced language models, companies can now generate high-quality drafts that maintain brand voice while significantly reducing production time.\n\n## Conclusion\nAs AI technology continues to evolve, the integration of automated content generation tools will become increasingly essential for competitive marketing operations.\n\n---\n*Note: This is mock content. Configure OPENAI_API_KEY for real AI generation.*";
    }
    if (promptLower.includes("social") || promptLower.includes("post")) {
        return "\uD83D\uDE80 Exciting news! AI-powered content generation is transforming how we create engaging marketing materials.\n\n\u2728 Key benefits:\n\u2022 10x faster content creation\n\u2022 Consistent brand voice\n\u2022 Data-driven optimization\n\nReady to revolutionize your content strategy? Let's connect! \uD83D\uDCA1\n\n#AI #Marketing #ContentCreation #Innovation\n\n---\n*Mock content - Enable OpenAI for real generation*";
    }
    if (promptLower.includes("email")) {
        return "Subject: Welcome to Our Platform!\n\nHi there,\n\nWe're thrilled to have you join our community! This is a mock email generated for demonstration purposes.\n\nIn production, this would be a personalized email created by our AI system based on your specific requirements, audience, and brand voice.\n\n**What's Next:**\n1. Complete your profile setup\n2. Explore our features\n3. Connect with our team\n\nLooking forward to helping you succeed!\n\nBest regards,\nThe Team\n\n---\n*Mock email - Configure OpenAI for personalized generation*";
    }
    // Generic mock content
    return "This is AI-generated content (mock mode) based on your prompt:\n\n\"".concat(prompt.substring(0, 200)).concat(prompt.length > 200 ? "..." : "", "\"\n\n**In production mode**, this would be replaced with high-quality content generated by OpenAI's GPT-4 model, tailored to your specific requirements, tone, and audience.\n\n**To enable real AI generation:**\n1. Add your OPENAI_API_KEY to backend/.env\n2. Restart the backend server\n3. Generate content again\n\n---\n*Mock content for demo purposes*");
}
function isInMockMode() {
    return isMockMode;
}
