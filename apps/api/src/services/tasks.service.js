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
exports.createTask = createTask;
exports.getTasks = getTasks;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
function createTask(userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var task, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.task.create({
                            data: {
                                title: input.title,
                                description: input.description,
                                priority: input.priority || 'medium',
                                tags: input.tags || [],
                                metadata: ((_a = input.metadata) !== null && _a !== void 0 ? _a : {}),
                                createdById: userId,
                                assigneeId: input.assigneeId,
                                dueDate: input.dueDate,
                            },
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    task = _b.sent();
                    logger_js_1.logger.info({ taskId: task.id, userId: userId }, 'Task created');
                    return [2 /*return*/, task];
                case 2:
                    error_1 = _b.sent();
                    logger_js_1.logger.error({ error: error_1, userId: userId }, 'Failed to create task');
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getTasks(userId, filters) {
    return __awaiter(this, void 0, void 0, function () {
        var where, tasks, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    where = {
                        OR: [
                            { createdById: userId },
                            { assigneeId: userId },
                        ],
                    };
                    if (filters === null || filters === void 0 ? void 0 : filters.status) {
                        where.status = filters.status;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.priority) {
                        where.priority = filters.priority;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.assigneeId) {
                        where.assigneeId = filters.assigneeId;
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.task.findMany({
                            where: where,
                            orderBy: [
                                { status: 'asc' },
                                { dueDate: 'asc' },
                            ],
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    tasks = _a.sent();
                    return [2 /*return*/, tasks];
                case 2:
                    error_2 = _a.sent();
                    logger_js_1.logger.error({ error: error_2, userId: userId }, 'Failed to fetch tasks');
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getTaskById(taskId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var task, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.task.findFirst({
                            where: {
                                id: taskId,
                                OR: [
                                    { createdById: userId },
                                    { assigneeId: userId },
                                ],
                            },
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    task = _a.sent();
                    if (!task) {
                        throw new Error('Task not found');
                    }
                    return [2 /*return*/, task];
                case 2:
                    error_3 = _a.sent();
                    logger_js_1.logger.error({ error: error_3, taskId: taskId, userId: userId }, 'Failed to fetch task');
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateTask(taskId, userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, updateData, task, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.task.findFirst({
                            where: {
                                id: taskId,
                                OR: [
                                    { createdById: userId },
                                    { assigneeId: userId },
                                ],
                            },
                        })];
                case 1:
                    existing = _a.sent();
                    if (!existing) {
                        throw new Error('Task not found');
                    }
                    updateData = {};
                    if (input.title)
                        updateData.title = input.title;
                    if (input.description !== undefined)
                        updateData.description = input.description;
                    if (input.status) {
                        updateData.status = input.status;
                        if (input.status === 'done' && !existing.completedAt) {
                            updateData.completedAt = new Date();
                        }
                    }
                    if (input.priority)
                        updateData.priority = input.priority;
                    if (input.assigneeId !== undefined)
                        updateData.assigneeId = input.assigneeId;
                    if (input.dueDate !== undefined)
                        updateData.dueDate = input.dueDate;
                    if (input.tags)
                        updateData.tags = input.tags;
                    if (input.metadata)
                        updateData.metadata = input.metadata;
                    return [4 /*yield*/, prisma_js_1.prisma.task.update({
                            where: { id: taskId },
                            data: updateData,
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    task = _a.sent();
                    logger_js_1.logger.info({ taskId: taskId, userId: userId }, 'Task updated');
                    return [2 /*return*/, task];
                case 3:
                    error_4 = _a.sent();
                    logger_js_1.logger.error({ error: error_4, taskId: taskId, userId: userId }, 'Failed to update task');
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function deleteTask(taskId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var task, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.task.findFirst({
                            where: {
                                id: taskId,
                                createdById: userId,
                            },
                        })];
                case 1:
                    task = _a.sent();
                    if (!task) {
                        throw new Error('Task not found or unauthorized');
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.task.delete({
                            where: { id: taskId },
                        })];
                case 2:
                    _a.sent();
                    logger_js_1.logger.info({ taskId: taskId, userId: userId }, 'Task deleted');
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_5 = _a.sent();
                    logger_js_1.logger.error({ error: error_5, taskId: taskId, userId: userId }, 'Failed to delete task');
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
