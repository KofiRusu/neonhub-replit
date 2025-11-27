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
exports.createSmsWorkers = createSmsWorkers;
exports.stopSmsWorkers = stopSmsWorkers;
var bullmq_1 = require("bullmq");
var twilio_1 = require("twilio");
var env_js_1 = require("../../config/env.js");
var logger_js_1 = require("../../lib/logger.js");
var metrics_js_1 = require("../../lib/metrics.js");
var twilioClient = env_js_1.env.TWILIO_SID && env_js_1.env.TWILIO_AUTH_TOKEN
    ? (0, twilio_1.default)(env_js_1.env.TWILIO_SID, env_js_1.env.TWILIO_AUTH_TOKEN)
    : null;
function processSmsCompose(job) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            logger_js_1.logger.info({ jobId: job.id, personId: job.data.personId }, "Processing sms.compose job");
            // Composition logic would use BrandVoiceService.compose() here
            // For now, we acknowledge the job
            return [2 /*return*/, {
                    composed: true,
                    personId: job.data.personId,
                    objective: job.data.objective,
                }];
        });
    });
}
function processSmsSend(job) {
    return __awaiter(this, void 0, void 0, function () {
        var from, message, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger_js_1.logger.info({ jobId: job.id, to: job.data.to }, "Processing sms.send job");
                    if (!twilioClient) {
                        logger_js_1.logger.warn({ jobId: job.id }, "Twilio not configured - skipping SMS send");
                        return [2 /*return*/, { sent: false, reason: "Twilio not configured" }];
                    }
                    from = (_a = job.data.from) !== null && _a !== void 0 ? _a : env_js_1.env.TWILIO_PHONE_NUMBER;
                    if (!from) {
                        throw new Error("No Twilio phone number configured");
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, twilioClient.messages.create({
                            from: from,
                            to: job.data.to,
                            body: job.data.body,
                        })];
                case 2:
                    message = _b.sent();
                    logger_js_1.logger.info({ jobId: job.id, messageSid: message.sid }, "SMS sent successfully");
                    return [2 /*return*/, {
                            sent: true,
                            messageSid: message.sid,
                            to: job.data.to,
                        }];
                case 3:
                    error_1 = _b.sent();
                    logger_js_1.logger.error({ jobId: job.id, error: error_1, to: job.data.to }, "Failed to send SMS");
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createSmsWorkers() {
    var _a;
    var redisUrl = (_a = env_js_1.env.REDIS_URL) !== null && _a !== void 0 ? _a : "redis://localhost:6379";
    var connection = { url: redisUrl };
    var composeWorker = new bullmq_1.Worker("sms.compose", processSmsCompose, {
        connection: connection,
        concurrency: 5,
    });
    var sendWorker = new bullmq_1.Worker("sms.send", processSmsSend, {
        connection: connection,
        concurrency: 10,
    });
    composeWorker.on("completed", function (job) {
        (0, metrics_js_1.recordQueueJob)("sms.compose", "completed");
        logger_js_1.logger.debug({ jobId: job.id }, "sms.compose job completed");
    });
    composeWorker.on("failed", function (job, err) {
        (0, metrics_js_1.recordQueueJob)("sms.compose", "failed");
        logger_js_1.logger.error({ jobId: job === null || job === void 0 ? void 0 : job.id, error: err }, "sms.compose job failed");
    });
    sendWorker.on("completed", function (job) {
        (0, metrics_js_1.recordQueueJob)("sms.send", "completed");
        logger_js_1.logger.debug({ jobId: job.id }, "sms.send job completed");
    });
    sendWorker.on("failed", function (job, err) {
        (0, metrics_js_1.recordQueueJob)("sms.send", "failed");
        logger_js_1.logger.error({ jobId: job === null || job === void 0 ? void 0 : job.id, error: err }, "sms.send job failed");
    });
    return { composeWorker: composeWorker, sendWorker: sendWorker };
}
function stopSmsWorkers(workers) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, workers.composeWorker.close()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, workers.sendWorker.close()];
                case 2:
                    _a.sent();
                    logger_js_1.logger.info("SMS workers stopped");
                    return [2 /*return*/];
            }
        });
    });
}
