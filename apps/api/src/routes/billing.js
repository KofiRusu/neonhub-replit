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
exports.billingRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var http_1 = require("../lib/http");
var requestUser_js_1 = require("../lib/requestUser.js");
var stripe_js_1 = require("../services/billing/stripe.js");
var prisma_js_1 = require("../db/prisma.js");
var errors_js_1 = require("../lib/errors.js");
exports.billingRouter = (0, express_1.Router)();
var planOptions = ["starter", "pro", "enterprise", "free"];
var checkoutSchema = zod_1.z
    .object({
    plan: zod_1.z.enum(planOptions).optional(),
    priceId: zod_1.z.string().min(1, "Invalid price ID").optional(),
    successUrl: zod_1.z.string().url("Invalid success URL"),
    cancelUrl: zod_1.z.string().url("Invalid cancel URL"),
})
    .refine(function (payload) { return Boolean(payload.plan) || Boolean(payload.priceId); }, { message: "Provide either plan or priceId", path: ["plan"] });
var portalSchema = zod_1.z.object({
    returnUrl: zod_1.z.string().url("Invalid return URL"),
});
var normalizePlan = function (plan) {
    if (!plan)
        return undefined;
    if (plan === "free")
        return "starter";
    return plan;
};
exports.billingRouter.get("/billing/plan", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, subscription, planKey, planConfig, error_1, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                user = (0, requestUser_js_1.getAuthenticatedUser)(req);
                return [4 /*yield*/, prisma_js_1.prisma.subscription.findUnique({ where: { userId: user.id } })];
            case 1:
                subscription = _d.sent();
                planKey = (_a = normalizePlan(subscription === null || subscription === void 0 ? void 0 : subscription.plan)) !== null && _a !== void 0 ? _a : "starter";
                planConfig = stripe_js_1.PLANS[planKey];
                return [2 /*return*/, res.json((0, http_1.ok)({
                        plan: planKey,
                        displayName: planConfig.name,
                        priceId: planConfig.priceId,
                        productId: planConfig.productId,
                        limits: planConfig.limits,
                        status: (_b = subscription === null || subscription === void 0 ? void 0 : subscription.status) !== null && _b !== void 0 ? _b : (planKey === "starter" ? "active" : "inactive"),
                        // keep backwards-compatible status until subscriptions table is migrated
                        currentPeriod: subscription
                            ? {
                                start: subscription.currentPeriodStart.toISOString(),
                                end: subscription.currentPeriodEnd.toISOString(),
                            }
                            : null,
                        cancelAtPeriodEnd: (_c = subscription === null || subscription === void 0 ? void 0 : subscription.cancelAtPeriodEnd) !== null && _c !== void 0 ? _c : false,
                    }))];
            case 2:
                error_1 = _d.sent();
                message = error_1 instanceof Error ? error_1.message : "Failed to fetch billing plan";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.billingRouter.get("/billing/usage", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, subscription, limits, error_2, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                user = (0, requestUser_js_1.getAuthenticatedUser)(req);
                return [4 /*yield*/, prisma_js_1.prisma.subscription.findUnique({ where: { userId: user.id } })];
            case 1:
                subscription = _a.sent();
                if (!subscription) {
                    limits = stripe_js_1.PLANS.starter.limits;
                    return [2 /*return*/, res.json((0, http_1.ok)({
                            campaigns: { used: 0, total: limits.campaigns },
                            emails: { used: 0, total: limits.emails },
                            socialPosts: { used: 0, total: limits.socialPosts },
                            agentCalls: { used: 0, total: limits.agentCalls },
                        }))];
                }
                return [2 /*return*/, res.json((0, http_1.ok)({
                        campaigns: { used: subscription.campaignsUsed, total: subscription.campaignLimit },
                        emails: { used: subscription.emailsSent, total: subscription.emailLimit },
                        socialPosts: { used: subscription.socialPosts, total: subscription.socialLimit },
                        agentCalls: { used: subscription.agentCalls, total: subscription.agentCallLimit },
                    }))];
            case 2:
                error_2 = _a.sent();
                message = error_2 instanceof Error ? error_2.message : "Failed to fetch usage";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.billingRouter.get("/billing/invoices", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, subscription, invoices, error_3, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = (0, requestUser_js_1.getAuthenticatedUser)(req);
                return [4 /*yield*/, prisma_js_1.prisma.subscription.findUnique({ where: { userId: user.id }, select: { id: true } })];
            case 1:
                subscription = _a.sent();
                if (!subscription) {
                    return [2 /*return*/, res.json((0, http_1.ok)([]))];
                }
                return [4 /*yield*/, prisma_js_1.prisma.invoice.findMany({
                        where: { subscriptionId: subscription.id },
                        orderBy: { createdAt: "desc" },
                        take: 12,
                    })];
            case 2:
                invoices = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(invoices.map(function (invoice) { return ({
                        id: invoice.id,
                        stripeInvoiceId: invoice.stripeInvoiceId,
                        amount: invoice.amountDue / 100,
                        currency: invoice.currency,
                        status: invoice.status,
                        invoiceUrl: invoice.hostedInvoiceUrl,
                        invoicePdf: invoice.invoicePdf,
                        createdAt: invoice.createdAt.toISOString(),
                    }); })))];
            case 3:
                error_3 = _a.sent();
                message = error_3 instanceof Error ? error_3.message : "Failed to fetch invoices";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.billingRouter.post("/billing/checkout", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, payload, planKey, session, error_4, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                user = (0, requestUser_js_1.getAuthenticatedUser)(req);
                payload = checkoutSchema.parse(req.body);
                planKey = normalizePlan(payload.plan);
                if (!user.email) {
                    throw new errors_js_1.ValidationError("User email is required for checkout");
                }
                return [4 /*yield*/, stripe_js_1.billingService.createCheckoutSession({
                        userId: user.id,
                        email: user.email,
                        plan: planKey,
                        priceId: payload.priceId,
                        successUrl: payload.successUrl,
                        cancelUrl: payload.cancelUrl,
                    })];
            case 1:
                session = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(session))];
            case 2:
                error_4 = _a.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_1.fail)(error_4.errors[0].message).body)];
                }
                if (error_4 instanceof errors_js_1.ValidationError) {
                    return [2 /*return*/, res.status(error_4.statusCode).json((0, http_1.fail)(error_4.message, error_4.statusCode).body)];
                }
                message = error_4 instanceof Error ? error_4.message : "Failed to create checkout session";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.billingRouter.post("/billing/portal", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, payload, session, error_5, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                user = (0, requestUser_js_1.getAuthenticatedUser)(req);
                payload = portalSchema.parse(req.body);
                return [4 /*yield*/, stripe_js_1.billingService.createPortalSession(user.id, payload.returnUrl)];
            case 1:
                session = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(session))];
            case 2:
                error_5 = _a.sent();
                if (error_5 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_1.fail)(error_5.errors[0].message).body)];
                }
                message = error_5 instanceof Error ? error_5.message : "Failed to create billing portal session";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.billingRouter;
