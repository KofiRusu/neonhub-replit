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
exports.messagesRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var messagingService = require("../services/messaging.service.js");
var http_js_1 = require("../lib/http.js");
exports.messagesRouter = (0, express_1.Router)();
// Validation schemas
var sendMessageSchema = zod_1.z.object({
    receiverId: zod_1.z.string().min(1, 'Receiver ID is required'),
    subject: zod_1.z.string().optional(),
    body: zod_1.z.string().min(1, 'Message body is required'),
    threadId: zod_1.z.string().optional(),
    replyToId: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// POST /messages - Send message
exports.messagesRouter.post('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, message, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                validatedData = sendMessageSchema.parse(req.body);
                return [4 /*yield*/, messagingService.sendMessage(req.user.id, validatedData)];
            case 1:
                message = _a.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(message))];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_1.errors[0].message).body)];
                }
                message = error_1 instanceof Error ? error_1.message : 'Failed to send message';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /messages - List messages
exports.messagesRouter.get('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, threadId, unreadOnly, filters, messages, error_2, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, threadId = _a.threadId, unreadOnly = _a.unreadOnly;
                filters = {};
                if (threadId && typeof threadId === 'string') {
                    filters.threadId = threadId;
                }
                if (unreadOnly === 'true') {
                    filters.unreadOnly = true;
                }
                return [4 /*yield*/, messagingService.getMessages(req.user.id, filters)];
            case 1:
                messages = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(messages))];
            case 2:
                error_2 = _b.sent();
                message = error_2 instanceof Error ? error_2.message : 'Failed to fetch messages';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /messages/threads - List threads
exports.messagesRouter.get('/threads', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var threads, error_3, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.getThreads(req.user.id)];
            case 1:
                threads = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(threads))];
            case 2:
                error_3 = _a.sent();
                message = error_3 instanceof Error ? error_3.message : 'Failed to fetch threads';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /messages/unread-count - Get unread message count
exports.messagesRouter.get('/unread-count', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_4, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.getUnreadCount(req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_4 = _a.sent();
                message = error_4 instanceof Error ? error_4.message : 'Failed to get unread count';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /messages/:id - Get specific message
exports.messagesRouter.get('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, error_5, message, status_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.getMessageById(req.params.id, req.user.id)];
            case 1:
                message = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(message))];
            case 2:
                error_5 = _a.sent();
                message = error_5 instanceof Error ? error_5.message : 'Failed to fetch message';
                status_1 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_1).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /messages/:id/read - Mark message as read
exports.messagesRouter.put('/:id/read', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, error_6, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.markMessageAsRead(req.params.id, req.user.id)];
            case 1:
                message = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(message))];
            case 2:
                error_6 = _a.sent();
                message = error_6 instanceof Error ? error_6.message : 'Failed to mark message as read';
                status_2 = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /messages/threads/:threadId/read - Mark thread as read
exports.messagesRouter.put('/threads/:threadId/read', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_7, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.markThreadAsRead(req.params.threadId, req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_7 = _a.sent();
                message = error_7 instanceof Error ? error_7.message : 'Failed to mark thread as read';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /messages/:id - Delete message
exports.messagesRouter.delete('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_8, message, status_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, messagingService.deleteMessage(req.params.id, req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_8 = _a.sent();
                message = error_8 instanceof Error ? error_8.message : 'Failed to delete message';
                status_3 = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
                return [2 /*return*/, res.status(status_3).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.messagesRouter;
