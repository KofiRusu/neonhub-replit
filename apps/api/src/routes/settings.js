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
var express_1 = require("express");
var auth_js_1 = require("../middleware/auth.js");
var settings_service_js_1 = require("../services/settings.service.js");
var zod_1 = require("zod");
var router = (0, express_1.Router)();
var settingsService = new settings_service_js_1.SettingsService();
// Validation
var updateSettingsSchema = zod_1.z.object({
    brandVoice: zod_1.z.record(zod_1.z.any()).optional(),
    emailNotifications: zod_1.z.boolean().optional(),
    pushNotifications: zod_1.z.boolean().optional(),
    notificationFrequency: zod_1.z.enum(['realtime', 'daily', 'weekly']).optional(),
    timezone: zod_1.z.string().optional(),
    locale: zod_1.z.string().optional(),
    dateFormat: zod_1.z.string().optional(),
    dataRetention: zod_1.z.number().min(1).max(365).optional(),
    allowAnalytics: zod_1.z.boolean().optional(),
    allowPersonalization: zod_1.z.boolean().optional(),
    apiRateLimit: zod_1.z.number().min(10).max(10000).optional(),
    webhookUrl: zod_1.z.string().url().optional().nullable(),
    webhookSecret: zod_1.z.string().optional().nullable(),
});
// Get settings
router.get('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService.getSettings(req.user.id)];
            case 1:
                settings = _a.sent();
                res.json({ settings: settings });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Get settings error:', error_1);
                res.status(500).json({ error: 'Failed to get settings' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update settings
router.put('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, settings, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = updateSettingsSchema.parse(req.body);
                return [4 /*yield*/, settingsService.updateSettings(req.user.id, data)];
            case 1:
                settings = _a.sent();
                res.json({ settings: settings });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid input', details: error_2.errors })];
                }
                console.error('Update settings error:', error_2);
                res.status(500).json({ error: 'Failed to update settings' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Specific setting updates
router.put('/brand-voice', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService.updateSettings(req.user.id, {
                        brandVoice: req.body,
                    })];
            case 1:
                settings = _a.sent();
                res.json({ brandVoice: settings.brandVoice });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Update brand voice error:', error_3);
                res.status(500).json({ error: 'Failed to update brand voice' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/notifications', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, settings, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = zod_1.z.object({
                    emailNotifications: zod_1.z.boolean().optional(),
                    pushNotifications: zod_1.z.boolean().optional(),
                    notificationFrequency: zod_1.z.enum(['realtime', 'daily', 'weekly']).optional(),
                }).parse(req.body);
                return [4 /*yield*/, settingsService.updateSettings(req.user.id, data)];
            case 1:
                settings = _a.sent();
                res.json({
                    emailNotifications: settings.emailNotifications,
                    pushNotifications: settings.pushNotifications,
                    notificationFrequency: settings.notificationFrequency,
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Update notifications error:', error_4);
                res.status(500).json({ error: 'Failed to update notifications' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/privacy', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, settings, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = zod_1.z.object({
                    dataRetention: zod_1.z.number().min(1).max(365).optional(),
                    allowAnalytics: zod_1.z.boolean().optional(),
                    allowPersonalization: zod_1.z.boolean().optional(),
                }).parse(req.body);
                return [4 /*yield*/, settingsService.updateSettings(req.user.id, data)];
            case 1:
                settings = _a.sent();
                res.json({
                    dataRetention: settings.dataRetention,
                    allowAnalytics: settings.allowAnalytics,
                    allowPersonalization: settings.allowPersonalization,
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Update privacy error:', error_5);
                res.status(500).json({ error: 'Failed to update privacy settings' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
