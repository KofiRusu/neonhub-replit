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
exports.feedbackRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var feedbackService = require("../services/feedback.service.js");
var http_js_1 = require("../lib/http.js");
exports.feedbackRouter = (0, express_1.Router)();
// Validation schemas
var createFeedbackSchema = zod_1.z.object({
    type: zod_1.z.enum(['bug', 'feature', 'improvement', 'question']),
    category: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    rating: zod_1.z.number().int().min(1).max(5).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var updateFeedbackSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    response: zod_1.z.string().optional(),
});
// POST /feedback - Submit feedback
exports.feedbackRouter.post('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, feedback, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                validatedData = createFeedbackSchema.parse(req.body);
                return [4 /*yield*/, feedbackService.createFeedback(req.user.id, validatedData)];
            case 1:
                feedback = _a.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(feedback))];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_1.errors[0].message).body)];
                }
                message = error_1 instanceof Error ? error_1.message : 'Failed to create feedback';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /feedback - List feedback
exports.feedbackRouter.get('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, status_1, category, allUsers, userId, filters, feedback, error_2, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, type = _a.type, status_1 = _a.status, category = _a.category, allUsers = _a.allUsers;
                userId = allUsers === 'true' && req.user.isBetaUser ? undefined : req.user.id;
                filters = {};
                if (type && typeof type === 'string') {
                    filters.type = type;
                }
                if (status_1 && typeof status_1 === 'string') {
                    filters.status = status_1;
                }
                if (category && typeof category === 'string') {
                    filters.category = category;
                }
                return [4 /*yield*/, feedbackService.getFeedback(userId, filters)];
            case 1:
                feedback = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(feedback))];
            case 2:
                error_2 = _b.sent();
                message = error_2 instanceof Error ? error_2.message : 'Failed to fetch feedback';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /feedback/stats - Get feedback statistics
exports.feedbackRouter.get('/stats', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, filters, stats, error_3, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                // Only beta users can view stats
                if (!req.user.isBetaUser) {
                    return [2 /*return*/, res.status(403).json((0, http_js_1.fail)('Unauthorized'))];
                }
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                filters = {};
                if (startDate && typeof startDate === 'string') {
                    filters.startDate = new Date(startDate);
                }
                if (endDate && typeof endDate === 'string') {
                    filters.endDate = new Date(endDate);
                }
                return [4 /*yield*/, feedbackService.getFeedbackStats(filters)];
            case 1:
                stats = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(stats))];
            case 2:
                error_3 = _b.sent();
                message = error_3 instanceof Error ? error_3.message : 'Failed to fetch feedback stats';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /feedback/:id - Get specific feedback
exports.feedbackRouter.get('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var feedback, error_4, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, feedbackService.getFeedbackById(req.params.id)];
            case 1:
                feedback = _a.sent();
                // Check authorization - only owner or beta users can view
                if (feedback.userId !== req.user.id && !req.user.isBetaUser) {
                    return [2 /*return*/, res.status(403).json((0, http_js_1.fail)('Unauthorized'))];
                }
                return [2 /*return*/, res.json((0, http_js_1.ok)(feedback))];
            case 2:
                error_4 = _a.sent();
                message = error_4 instanceof Error ? error_4.message : 'Failed to fetch feedback';
                status_2 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /feedback/:id - Update feedback (admin only)
exports.feedbackRouter.put('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, feedback, error_5, message, status_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Only beta users can update feedback status/response
                if (!req.user.isBetaUser) {
                    return [2 /*return*/, res.status(403).json((0, http_js_1.fail)('Unauthorized'))];
                }
                validatedData = updateFeedbackSchema.parse(req.body);
                return [4 /*yield*/, feedbackService.updateFeedback(req.params.id, validatedData)];
            case 1:
                feedback = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(feedback))];
            case 2:
                error_5 = _a.sent();
                if (error_5 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_5.errors[0].message).body)];
                }
                message = error_5 instanceof Error ? error_5.message : 'Failed to update feedback';
                status_3 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_3).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /feedback/:id - Delete feedback
exports.feedbackRouter.delete('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_6, message, status_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, feedbackService.deleteFeedback(req.params.id, req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_6 = _a.sent();
                message = error_6 instanceof Error ? error_6.message : 'Failed to delete feedback';
                status_4 = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
                return [2 /*return*/, res.status(status_4).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.feedbackRouter;
