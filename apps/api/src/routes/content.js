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
exports.contentRouter = void 0;
var express_1 = require("express");
var prisma_js_1 = require("../db/prisma.js");
var index_js_1 = require("../types/index.js");
var errors_js_1 = require("../lib/errors.js");
var logger_js_1 = require("../lib/logger.js");
var ContentAgent_js_1 = require("../agents/content/ContentAgent.js");
var requestUser_js_1 = require("../lib/requestUser.js");
exports.contentRouter = (0, express_1.Router)();
// Generate content using ContentAgent
exports.contentRouter.post("/content/generate", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, _a, topic, tone, audience, notes, brandId, brandVoiceId, campaignGoal, callToAction, output, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                result = index_js_1.GenerateContentRequestSchema.safeParse(req.body);
                if (!result.success) {
                    throw new errors_js_1.ValidationError(result.error.errors[0].message);
                }
                _a = result.data, topic = _a.topic, tone = _a.tone, audience = _a.audience, notes = _a.notes, brandId = _a.brandId, brandVoiceId = _a.brandVoiceId, campaignGoal = _a.campaignGoal, callToAction = _a.callToAction;
                return [4 /*yield*/, ContentAgent_js_1.contentAgent.generateArticle({
                        topic: topic,
                        primaryKeyword: topic,
                        tone: tone,
                        audience: audience,
                        callToAction: callToAction,
                        brandId: brandId,
                        brandVoiceId: brandVoiceId,
                        createdById: userId,
                    })];
            case 1:
                output = _b.sent();
                logger_js_1.logger.info({ draftId: output.draftId, jobId: output.jobId, topic: topic }, "Content generation initiated");
                res.json({
                    success: true,
                    data: {
                        jobId: output.jobId,
                        draftId: output.draftId,
                        title: output.title,
                        summary: output.summary,
                        meta: output.meta,
                        schema: output.schema,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get all drafts (paginated)
exports.contentRouter.get("/content/drafts", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, page, limit, skip, _a, drafts, total, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 10;
                skip = (page - 1) * limit;
                return [4 /*yield*/, Promise.all([
                        prisma_js_1.prisma.contentDraft.findMany({
                            where: {
                                createdById: userId,
                            },
                            take: limit,
                            skip: skip,
                            orderBy: { createdAt: "desc" },
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        }),
                        prisma_js_1.prisma.contentDraft.count({
                            where: {
                                createdById: userId,
                            },
                        }),
                    ])];
            case 1:
                _a = _b.sent(), drafts = _a[0], total = _a[1];
                res.json({
                    success: true,
                    data: drafts,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get single draft
exports.contentRouter.get("/content/drafts/:id", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, draft, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                return [4 /*yield*/, prisma_js_1.prisma.contentDraft.findUnique({
                        where: { id: id },
                        include: {
                            createdBy: {
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
                draft = _a.sent();
                if (!draft) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: "Draft not found",
                        })];
                }
                if (draft.createdById !== userId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                res.json({
                    success: true,
                    data: draft,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
