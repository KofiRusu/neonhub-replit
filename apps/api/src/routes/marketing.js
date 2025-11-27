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
exports.marketingRouter = void 0;
var express_1 = require("express");
var prisma_js_1 = require("../db/prisma.js");
var errors_js_1 = require("../lib/errors.js");
var zod_1 = require("zod");
var client_1 = require("@prisma/client");
var marketingRouter = (0, express_1.Router)();
exports.marketingRouter = marketingRouter;
var createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Campaign name is required"),
    description: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(client_1.MarketingCampaignType),
    status: zod_1.z.nativeEnum(client_1.MarketingCampaignStatus).optional(),
    brandId: zod_1.z.string().optional(),
    budget: zod_1.z.number().min(0).optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
function resolveOrganizationId(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var membership;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.organizationMembership.findFirst({
                        where: { userId: userId },
                        select: { organizationId: true },
                    })];
                case 1:
                    membership = _b.sent();
                    return [2 /*return*/, (_a = membership === null || membership === void 0 ? void 0 : membership.organizationId) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
marketingRouter.get("/overview", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, organizationId, _a, campaigns, leads, metrics, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new errors_js_1.AppError("Unauthorized", 401, "UNAUTHORIZED");
                }
                return [4 /*yield*/, resolveOrganizationId(user.id)];
            case 1:
                organizationId = _b.sent();
                if (!organizationId) {
                    throw new errors_js_1.AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
                }
                return [4 /*yield*/, Promise.all([
                        prisma_js_1.prisma.marketingCampaign.count({ where: { organizationId: organizationId } }),
                        prisma_js_1.prisma.marketingLead.count({ where: { organizationId: organizationId } }),
                        prisma_js_1.prisma.marketingMetric.findMany({
                            where: { organizationId: organizationId },
                            orderBy: { date: "desc" },
                            take: 30,
                        }),
                    ])];
            case 2:
                _a = _b.sent(), campaigns = _a[0], leads = _a[1], metrics = _a[2];
                res.json({
                    success: true,
                    data: {
                        totalCampaigns: campaigns,
                        totalLeads: leads,
                        recentMetrics: metrics,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
marketingRouter.get("/campaigns", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, organizationId, campaigns, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new errors_js_1.AppError("Unauthorized", 401, "UNAUTHORIZED");
                }
                return [4 /*yield*/, resolveOrganizationId(user.id)];
            case 1:
                organizationId = _a.sent();
                if (!organizationId) {
                    throw new errors_js_1.AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
                }
                return [4 /*yield*/, prisma_js_1.prisma.marketingCampaign.findMany({
                        where: { organizationId: organizationId },
                        orderBy: { createdAt: "desc" },
                    })];
            case 2:
                campaigns = _a.sent();
                res.json({ success: true, data: campaigns });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
marketingRouter.post("/campaigns", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, organizationId, payload, newCampaign, error_3;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new errors_js_1.AppError("Unauthorized", 401, "UNAUTHORIZED");
                }
                return [4 /*yield*/, resolveOrganizationId(user.id)];
            case 1:
                organizationId = _e.sent();
                if (!organizationId) {
                    throw new errors_js_1.AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
                }
                payload = createCampaignSchema.parse(req.body);
                return [4 /*yield*/, prisma_js_1.prisma.marketingCampaign.create({
                        data: {
                            organizationId: organizationId,
                            name: payload.name,
                            description: payload.description,
                            type: payload.type,
                            status: (_a = payload.status) !== null && _a !== void 0 ? _a : client_1.MarketingCampaignStatus.draft,
                            brandId: payload.brandId,
                            budget: payload.budget,
                            startDate: (_b = payload.startDate) !== null && _b !== void 0 ? _b : new Date(),
                            endDate: payload.endDate,
                        },
                    })];
            case 2:
                newCampaign = _e.sent();
                res.status(201).json({ success: true, data: newCampaign });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _e.sent();
                if (error_3 instanceof zod_1.z.ZodError) {
                    res.status(400).json({ success: false, error: (_d = (_c = error_3.errors[0]) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Invalid payload" });
                    return [2 /*return*/];
                }
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
