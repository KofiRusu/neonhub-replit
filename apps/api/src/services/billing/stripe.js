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
exports.billingService = exports.BillingService = exports.PLANS = void 0;
var url_1 = require("url");
var prisma_js_1 = require("../../db/prisma.js");
var logger_js_1 = require("../../lib/logger.js");
var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
var resolveEnv = function (candidates) {
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var key = candidates_1[_i];
        var value = process.env[key];
        if (value && value.length > 0) {
            return value;
        }
    }
    return "";
};
if (!STRIPE_SECRET_KEY) {
    logger_js_1.logger.warn("STRIPE_SECRET_KEY is not configured – billing API will operate in sandbox mode");
}
function stripeRequest(path_1, params_1) {
    return __awaiter(this, arguments, void 0, function (path, params, method) {
        var url, body, response, error_1, message, text;
        if (method === void 0) { method = "POST"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!STRIPE_SECRET_KEY) {
                        throw new Error("Stripe secret key not configured");
                    }
                    url = "https://api.stripe.com/v1/".concat(path);
                    body = new url_1.URLSearchParams(params);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch(method === "GET" ? "".concat(url, "?").concat(body.toString()) : url, {
                            method: method,
                            headers: {
                                Authorization: "Bearer ".concat(STRIPE_SECRET_KEY),
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: method === "GET" ? undefined : body.toString(),
                        })];
                case 2:
                    response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    message = error_1 instanceof Error ? error_1.message : "Unknown fetch error";
                    throw new Error("Failed to reach Stripe API (".concat(path, "): ").concat(message));
                case 4:
                    if (!!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.text()];
                case 5:
                    text = _a.sent();
                    throw new Error("Stripe API error ".concat(response.status, ": ").concat(text));
                case 6: return [4 /*yield*/, response.json()];
                case 7: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
var PLAN_PRICE_KEYS = {
    starter: ["STRIPE_PRICE_ID_STARTER", "STRIPE_PRICE_STARTER", "STRIPE_PRICE_FREE"],
    pro: ["STRIPE_PRICE_ID_PRO", "STRIPE_PRICE_PRO"],
    enterprise: ["STRIPE_PRICE_ID_ENTERPRISE", "STRIPE_PRICE_ENTERPRISE"],
};
var PLAN_PRODUCT_KEYS = {
    starter: ["STRIPE_PRODUCT_STARTER", "STRIPE_PRODUCT_FREE"],
    pro: ["STRIPE_PRODUCT_PRO"],
    enterprise: ["STRIPE_PRODUCT_ENTERPRISE"],
};
exports.PLANS = {
    starter: {
        name: "Starter",
        priceId: resolveEnv(PLAN_PRICE_KEYS.starter),
        productId: resolveEnv(PLAN_PRODUCT_KEYS.starter),
        limits: {
            campaigns: 5,
            emails: 1000,
            socialPosts: 100,
            agentCalls: 100,
        },
    },
    pro: {
        name: "Pro",
        priceId: resolveEnv(PLAN_PRICE_KEYS.pro),
        productId: resolveEnv(PLAN_PRODUCT_KEYS.pro),
        limits: {
            campaigns: 50,
            emails: 50000,
            socialPosts: 5000,
            agentCalls: 5000,
        },
    },
    enterprise: {
        name: "Enterprise",
        priceId: resolveEnv(PLAN_PRICE_KEYS.enterprise),
        productId: resolveEnv(PLAN_PRODUCT_KEYS.enterprise),
        limits: {
            campaigns: 999999,
            emails: 999999,
            socialPosts: 999999,
            agentCalls: 999999,
        },
    },
};
var findPlanByPriceId = function (priceId) {
    var _a;
    if (!priceId)
        return undefined;
    return (_a = Object.entries(exports.PLANS).find(function (_a) {
        var config = _a[1];
        return config.priceId === priceId;
    })) === null || _a === void 0 ? void 0 : _a[0];
};
var logMissingPlanConfig = function () {
    var missingPlans = Object.entries(exports.PLANS)
        .filter(function (_a) {
        var config = _a[1];
        return !config.priceId || !config.productId;
    })
        .map(function (_a) {
        var key = _a[0];
        return key;
    });
    if (missingPlans.length > 0) {
        logger_js_1.logger.warn({ missingPlans: missingPlans }, "Stripe plan configuration incomplete – checkout sessions will fail for these plans");
    }
};
logMissingPlanConfig();
var BillingService = /** @class */ (function () {
    function BillingService() {
    }
    BillingService.prototype.getOrCreateCustomer = function (userId, email) {
        return __awaiter(this, void 0, void 0, function () {
            var user, customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })];
                    case 1:
                        user = _a.sent();
                        if (user === null || user === void 0 ? void 0 : user.stripeCustomerId) {
                            return [2 /*return*/, user.stripeCustomerId];
                        }
                        return [4 /*yield*/, stripeRequest("customers", {
                                email: email,
                                "metadata[userId]": userId,
                            })];
                    case 2:
                        customer = _a.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })];
                    case 3:
                        _a.sent();
                        logger_js_1.logger.info({ customerId: customer.id, userId: userId }, "Stripe customer created");
                        return [2 /*return*/, customer.id];
                }
            });
        });
    };
    BillingService.prototype.createCheckoutSession = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var customerId, planKey, planConfig, priceId, session;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getOrCreateCustomer(params.userId, params.email)];
                    case 1:
                        customerId = _d.sent();
                        planKey = (_a = params.plan) !== null && _a !== void 0 ? _a : findPlanByPriceId(params.priceId);
                        planConfig = planKey ? exports.PLANS[planKey] : undefined;
                        priceId = (_b = params.priceId) !== null && _b !== void 0 ? _b : planConfig === null || planConfig === void 0 ? void 0 : planConfig.priceId;
                        if (!priceId) {
                            throw new Error("Price ID not configured for plan ".concat((_c = params.plan) !== null && _c !== void 0 ? _c : "custom"));
                        }
                        return [4 /*yield*/, stripeRequest("checkout/sessions", __assign({ mode: "subscription", success_url: params.successUrl, cancel_url: params.cancelUrl, customer: customerId, "line_items[0][price]": priceId, "line_items[0][quantity]": "1", "metadata[userId]": params.userId }, (planKey ? { "metadata[plan]": planKey } : {})))];
                    case 2:
                        session = _d.sent();
                        if (!session.url) {
                            throw new Error("Stripe checkout session did not include URL");
                        }
                        logger_js_1.logger.info({ plan: planKey !== null && planKey !== void 0 ? planKey : "custom", priceId: priceId, userId: params.userId }, "Stripe checkout session created");
                        return [2 /*return*/, { url: session.url }];
                }
            });
        });
    };
    BillingService.prototype.createPortalSession = function (userId, returnUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var user, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })];
                    case 1:
                        user = _a.sent();
                        if (!(user === null || user === void 0 ? void 0 : user.stripeCustomerId)) {
                            throw new Error("No Stripe customer found");
                        }
                        return [4 /*yield*/, stripeRequest("billing_portal/sessions", {
                                customer: user.stripeCustomerId,
                                return_url: returnUrl,
                            })];
                    case 2:
                        session = _a.sent();
                        return [2 /*return*/, { url: session.url }];
                }
            });
        });
    };
    BillingService.prototype.checkLimit = function (userId, resourceType) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, limits, limitMap_1, usedMap, limitMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.subscription.findUnique({ where: { userId: userId } })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) {
                            limits = exports.PLANS.starter.limits;
                            limitMap_1 = {
                                campaign: limits.campaigns,
                                email: limits.emails,
                                social_post: limits.socialPosts,
                                agent_call: limits.agentCalls,
                            };
                            return [2 /*return*/, { allowed: false, limit: limitMap_1[resourceType], used: 0 }];
                        }
                        usedMap = {
                            campaign: subscription.campaignsUsed,
                            email: subscription.emailsSent,
                            social_post: subscription.socialPosts,
                            agent_call: subscription.agentCalls,
                        };
                        limitMap = {
                            campaign: subscription.campaignLimit,
                            email: subscription.emailLimit,
                            social_post: subscription.socialLimit,
                            agent_call: subscription.agentCallLimit,
                        };
                        return [2 /*return*/, {
                                allowed: usedMap[resourceType] < limitMap[resourceType],
                                limit: limitMap[resourceType],
                                used: usedMap[resourceType],
                            }];
                }
            });
        });
    };
    BillingService.prototype.trackUsage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, fieldMap;
            var _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.subscription.findUnique({ where: { userId: params.userId } })];
                    case 1:
                        subscription = _d.sent();
                        if (!subscription) {
                            logger_js_1.logger.warn({ userId: params.userId }, "Tracking usage for user without subscription");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.usageRecord.create({
                                data: {
                                    subscriptionId: subscription.id,
                                    resourceType: params.resourceType,
                                    resourceId: params.resourceId,
                                    quantity: (_b = params.quantity) !== null && _b !== void 0 ? _b : 1,
                                    timestamp: new Date(),
                                },
                            })];
                    case 2:
                        _d.sent();
                        fieldMap = {
                            campaign: "campaignsUsed",
                            email: "emailsSent",
                            social_post: "socialPosts",
                            agent_call: "agentCalls",
                        };
                        return [4 /*yield*/, prisma_js_1.prisma.subscription.update({
                                where: { id: subscription.id },
                                data: (_a = {},
                                    _a[fieldMap[params.resourceType]] = {
                                        increment: (_c = params.quantity) !== null && _c !== void 0 ? _c : 1,
                                    },
                                    _a),
                            })];
                    case 3:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return BillingService;
}());
exports.BillingService = BillingService;
exports.billingService = new BillingService();
