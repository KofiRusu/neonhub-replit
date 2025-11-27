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
exports.createFeedback = createFeedback;
exports.getFeedback = getFeedback;
exports.getFeedbackById = getFeedbackById;
exports.updateFeedback = updateFeedback;
exports.deleteFeedback = deleteFeedback;
exports.getFeedbackStats = getFeedbackStats;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
function createFeedback(userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var feedback, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    // Validate rating if provided
                    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
                        throw new Error('Rating must be between 1 and 5');
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.create({
                            data: {
                                type: input.type,
                                category: input.category,
                                title: input.title,
                                description: input.description,
                                rating: input.rating,
                                metadata: ((_a = input.metadata) !== null && _a !== void 0 ? _a : {}),
                                userId: userId,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    feedback = _b.sent();
                    logger_js_1.logger.info({ feedbackId: feedback.id, userId: userId, type: input.type }, 'Feedback created');
                    return [2 /*return*/, feedback];
                case 2:
                    error_1 = _b.sent();
                    logger_js_1.logger.error({ error: error_1, userId: userId }, 'Failed to create feedback');
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getFeedback(userId, filters) {
    return __awaiter(this, void 0, void 0, function () {
        var where, feedback, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    where = {};
                    if (userId) {
                        where.userId = userId;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.type) {
                        where.type = filters.type;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.status) {
                        where.status = filters.status;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.category) {
                        where.category = filters.category;
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.findMany({
                            where: where,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    feedback = _a.sent();
                    return [2 /*return*/, feedback];
                case 2:
                    error_2 = _a.sent();
                    logger_js_1.logger.error({ error: error_2, userId: userId }, 'Failed to fetch feedback');
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getFeedbackById(feedbackId) {
    return __awaiter(this, void 0, void 0, function () {
        var feedback, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.findUnique({
                            where: { id: feedbackId },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    feedback = _a.sent();
                    if (!feedback) {
                        throw new Error('Feedback not found');
                    }
                    return [2 /*return*/, feedback];
                case 2:
                    error_3 = _a.sent();
                    logger_js_1.logger.error({ error: error_3, feedbackId: feedbackId }, 'Failed to fetch feedback');
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateFeedback(feedbackId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, feedback, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    updateData = {};
                    if (input.status) {
                        updateData.status = input.status;
                        if (input.status === 'resolved' || input.status === 'closed') {
                            updateData.resolvedAt = new Date();
                        }
                    }
                    if (input.response) {
                        updateData.response = input.response;
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.update({
                            where: { id: feedbackId },
                            data: updateData,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    feedback = _a.sent();
                    logger_js_1.logger.info({ feedbackId: feedbackId, status: input.status }, 'Feedback updated');
                    return [2 /*return*/, feedback];
                case 2:
                    error_4 = _a.sent();
                    logger_js_1.logger.error({ error: error_4, feedbackId: feedbackId }, 'Failed to update feedback');
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteFeedback(feedbackId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var feedback, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.findFirst({
                            where: {
                                id: feedbackId,
                                userId: userId,
                            },
                        })];
                case 1:
                    feedback = _a.sent();
                    if (!feedback) {
                        throw new Error('Feedback not found or unauthorized');
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.feedback.delete({
                            where: { id: feedbackId },
                        })];
                case 2:
                    _a.sent();
                    logger_js_1.logger.info({ feedbackId: feedbackId, userId: userId }, 'Feedback deleted');
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_5 = _a.sent();
                    logger_js_1.logger.error({ error: error_5, feedbackId: feedbackId, userId: userId }, 'Failed to delete feedback');
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getFeedbackStats(filters) {
    return __awaiter(this, void 0, void 0, function () {
        var where, _a, total, byType, byStatus, avgRating, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    where = {};
                    if ((filters === null || filters === void 0 ? void 0 : filters.startDate) || (filters === null || filters === void 0 ? void 0 : filters.endDate)) {
                        where.createdAt = {};
                        if (filters.startDate)
                            where.createdAt.gte = filters.startDate;
                        if (filters.endDate)
                            where.createdAt.lte = filters.endDate;
                    }
                    return [4 /*yield*/, Promise.all([
                            prisma_js_1.prisma.feedback.count({ where: where }),
                            prisma_js_1.prisma.feedback.groupBy({
                                by: ['type'],
                                where: where,
                                _count: true,
                            }),
                            prisma_js_1.prisma.feedback.groupBy({
                                by: ['status'],
                                where: where,
                                _count: true,
                            }),
                            prisma_js_1.prisma.feedback.aggregate({
                                where: __assign(__assign({}, where), { rating: { not: null } }),
                                _avg: { rating: true },
                            }),
                        ])];
                case 1:
                    _a = _b.sent(), total = _a[0], byType = _a[1], byStatus = _a[2], avgRating = _a[3];
                    return [2 /*return*/, {
                            total: total,
                            byType: byType.reduce(function (acc, item) {
                                acc[item.type] = item._count;
                                return acc;
                            }, {}),
                            byStatus: byStatus.reduce(function (acc, item) {
                                acc[item.status] = item._count;
                                return acc;
                            }, {}),
                            averageRating: avgRating._avg.rating || 0,
                        }];
                case 2:
                    error_6 = _b.sent();
                    logger_js_1.logger.error({ error: error_6 }, 'Failed to fetch feedback stats');
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
