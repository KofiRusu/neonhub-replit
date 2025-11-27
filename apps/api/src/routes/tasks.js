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
exports.tasksRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var tasksService = require("../services/tasks.service.js");
var http_js_1 = require("../lib/http.js");
exports.tasksRouter = (0, express_1.Router)();
// Validation schemas
var createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: zod_1.z.string().nullable().optional(),
    dueDate: zod_1.z.string().datetime().nullable().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// POST /tasks - Create new task
exports.tasksRouter.post('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, taskData, task, error_1, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                validatedData = createTaskSchema.parse(req.body);
                taskData = {
                    title: validatedData.title,
                    description: validatedData.description,
                    priority: validatedData.priority,
                    assigneeId: validatedData.assigneeId,
                    dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
                    tags: validatedData.tags,
                    metadata: (_a = validatedData.metadata) !== null && _a !== void 0 ? _a : {},
                };
                return [4 /*yield*/, tasksService.createTask(req.user.id, taskData)];
            case 1:
                task = _b.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(task))];
            case 2:
                error_1 = _b.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_1.errors[0].message).body)];
                }
                message = error_1 instanceof Error ? error_1.message : 'Failed to create task';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /tasks - List tasks
exports.tasksRouter.get('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_1, priority, assigneeId, filters, tasks, error_2, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, status_1 = _a.status, priority = _a.priority, assigneeId = _a.assigneeId;
                filters = {};
                if (status_1 && typeof status_1 === 'string') {
                    filters.status = status_1;
                }
                if (priority && typeof priority === 'string') {
                    filters.priority = priority;
                }
                if (assigneeId && typeof assigneeId === 'string') {
                    filters.assigneeId = assigneeId;
                }
                return [4 /*yield*/, tasksService.getTasks(req.user.id, filters)];
            case 1:
                tasks = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(tasks))];
            case 2:
                error_2 = _b.sent();
                message = error_2 instanceof Error ? error_2.message : 'Failed to fetch tasks';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /tasks/:id - Get specific task
exports.tasksRouter.get('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task, error_3, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, tasksService.getTaskById(req.params.id, req.user.id)];
            case 1:
                task = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(task))];
            case 2:
                error_3 = _a.sent();
                message = error_3 instanceof Error ? error_3.message : 'Failed to fetch task';
                status_2 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /tasks/:id - Update task
exports.tasksRouter.put('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, taskData, task, error_4, message, status_3;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                validatedData = updateTaskSchema.parse(req.body);
                taskData = {
                    title: validatedData.title,
                    description: validatedData.description,
                    status: validatedData.status,
                    priority: validatedData.priority,
                    tags: validatedData.tags,
                    metadata: (_a = validatedData.metadata) !== null && _a !== void 0 ? _a : undefined,
                };
                if (validatedData.dueDate !== undefined) {
                    taskData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
                }
                if (validatedData.assigneeId !== undefined) {
                    taskData.assigneeId = (_b = validatedData.assigneeId) !== null && _b !== void 0 ? _b : null;
                }
                return [4 /*yield*/, tasksService.updateTask(req.params.id, req.user.id, taskData)];
            case 1:
                task = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(task))];
            case 2:
                error_4 = _c.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_4.errors[0].message).body)];
                }
                message = error_4 instanceof Error ? error_4.message : 'Failed to update task';
                status_3 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_3).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /tasks/:id - Delete task
exports.tasksRouter.delete('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_5, message, status_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, tasksService.deleteTask(req.params.id, req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_5 = _a.sent();
                message = error_5 instanceof Error ? error_5.message : 'Failed to delete task';
                status_4 = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
                return [2 /*return*/, res.status(status_4).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.tasksRouter;
