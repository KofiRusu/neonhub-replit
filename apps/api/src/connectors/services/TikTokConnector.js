"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.TikTokConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var credentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "TikTok Marketing API access token is required"),
    advertiserId: zod_1.z.string().min(1, "Advertiser ID is required"),
});
var createCampaignInput = zod_1.z.object({
    advertiserId: zod_1.z.string().optional(),
    campaignName: zod_1.z.string().min(1, "Campaign name is required"),
    objectiveType: zod_1.z.enum(["TRAFFIC", "LEAD_GENERATION", "CONVERSIONS"]).default("TRAFFIC"),
    budgetMode: zod_1.z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL"]).default("BUDGET_MODE_DAY"),
    budget: zod_1.z.number().min(0, "Budget must be positive"),
});
var createAdGroupInput = zod_1.z.object({
    advertiserId: zod_1.z.string().optional(),
    campaignId: zod_1.z.string().min(1, "Campaign ID is required"),
    adGroupName: zod_1.z.string().min(1, "Ad group name is required"),
    placementType: zod_1.z.enum(["PLACEMENT_NORMAL", "PLACEMENT_AUTOMATIC"]).default("PLACEMENT_AUTOMATIC"),
    optimizationGoal: zod_1.z
        .enum(["OPTIMIZATION_GOAL_CONVERSIONS", "OPTIMIZATION_GOAL_CLICKS", "OPTIMIZATION_GOAL_IMPRESSIONS"])
        .default("OPTIMIZATION_GOAL_CONVERSIONS"),
    billingEvent: zod_1.z.enum(["BILLINGEVENT_CLICK", "BILLINGEVENT_IMPRESSION"]).default("BILLINGEVENT_CLICK"),
    bid: zod_1.z.number().positive("Bid must be greater than 0"),
});
var reportInsightsInput = zod_1.z.object({
    advertiserId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().min(8, "Start date (YYYY-MM-DD) is required"),
    endDate: zod_1.z.string().min(8, "End date (YYYY-MM-DD) is required"),
    metrics: zod_1.z
        .array(zod_1.z.enum([
        "spend",
        "impressions",
        "clicks",
        "conversion",
        "cpc",
        "ctr",
        "cpm",
    ]))
        .default(["spend", "impressions", "clicks", "conversion"]),
    orderType: zod_1.z.enum(["ASC", "DESC"]).default("DESC"),
    limit: zod_1.z.number().min(1).max(100).default(10),
});
function resolveCredentials(auth, overrideAdvertiserId) {
    var _a, _b;
    var accessToken = (_a = auth.accessToken) !== null && _a !== void 0 ? _a : auth.apiKey;
    var advertiserId = overrideAdvertiserId !== null && overrideAdvertiserId !== void 0 ? overrideAdvertiserId : (_b = auth.metadata) === null || _b === void 0 ? void 0 : _b.advertiserId;
    var parsed = credentialsSchema.parse({ accessToken: accessToken, advertiserId: advertiserId });
    return {
        accessToken: parsed.accessToken,
        advertiserId: parsed.advertiserId,
    };
}
function tiktokRequest(path, creds, body) {
    return __awaiter(this, void 0, void 0, function () {
        var response, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://business-api.tiktok.com/open_api/v1.3/".concat(path), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Token": creds.accessToken,
                        },
                        body: JSON.stringify(body),
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("TikTok API error ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    payload = (_a.sent());
                    if (payload.code !== 0) {
                        throw new Error(payload.message || "TikTok API request failed");
                    }
                    return [2 /*return*/, payload.data];
            }
        });
    });
}
var TikTokConnector = /** @class */ (function (_super) {
    __extends(TikTokConnector, _super);
    function TikTokConnector() {
        var _this = _super.call(this, {
            name: "tiktok",
            displayName: "TikTok Ads",
            description: "Automate TikTok campaign creation and performance insights.",
            category: "TIKTOK",
            iconUrl: "https://www.tiktok.com/favicon.ico",
            websiteUrl: "https://ads.tiktok.com",
            authType: "oauth2",
            authConfig: {
                instructions: "Provide a TikTok Marketing API access token with advertiser scope. Set advertiser ID using metadata.advertiserId if not supplied per request.",
            },
        }) || this;
        _this.actions = [
            {
                id: "createCampaign",
                name: "Create Campaign",
                description: "Create a TikTok Ads campaign with objective and budget configuration.",
                inputSchema: createCampaignInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createCampaignInput.parse(input);
                                creds = resolveCredentials(auth, payload.advertiserId);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return tiktokRequest("campaign/create/", creds, {
                                            advertiser_id: creds.advertiserId,
                                            objective_type: payload.objectiveType,
                                            campaign_name: payload.campaignName,
                                            budget_mode: payload.budgetMode,
                                            budget: payload.budget,
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, {
                                        campaignId: result.campaign_id,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "createAdGroup",
                name: "Create Ad Group",
                description: "Create an ad group under an existing campaign.",
                inputSchema: createAdGroupInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createAdGroupInput.parse(input);
                                creds = resolveCredentials(auth, payload.advertiserId);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return tiktokRequest("adgroup/create/", creds, {
                                            advertiser_id: creds.advertiserId,
                                            campaign_id: payload.campaignId,
                                            adgroup_name: payload.adGroupName,
                                            placement_type: payload.placementType,
                                            optimization_goal: payload.optimizationGoal,
                                            billing_event: payload.billingEvent,
                                            bid: payload.bid,
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, {
                                        adGroupId: result.adgroup_id,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "getPerformanceReport",
                name: "Get Performance Report",
                description: "Fetch aggregated performance metrics for a date range.",
                inputSchema: reportInsightsInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, data;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = reportInsightsInput.parse(input);
                                creds = resolveCredentials(auth, payload.advertiserId);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        var _a;
                                        return tiktokRequest("report/integrated/get/", creds, {
                                            advertiser_id: creds.advertiserId,
                                            report_type: "BASIC",
                                            data_level: "AUCTION_CAMPAIGN",
                                            start_date: payload.startDate,
                                            end_date: payload.endDate,
                                            metrics: payload.metrics,
                                            order_field: (_a = payload.metrics[0]) !== null && _a !== void 0 ? _a : "spend",
                                            order_type: payload.orderType,
                                            page_size: payload.limit,
                                            page: 1,
                                        });
                                    })];
                            case 1:
                                data = _d.sent();
                                return [2 /*return*/, (_c = data.list) !== null && _c !== void 0 ? _c : []];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    TikTokConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = resolveCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                return tiktokRequest("campaign/get/", creds_1, {
                                    advertiser_id: creds_1.advertiserId,
                                    page_size: 1,
                                    page: 1,
                                });
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return TikTokConnector;
}(Connector_js_1.Connector));
exports.TikTokConnector = TikTokConnector;
