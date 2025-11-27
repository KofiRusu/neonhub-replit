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
exports.GoogleAdsConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var credentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Google Ads access token is required"),
    customerId: zod_1.z.string().min(1, "Customer ID is required"),
    developerToken: zod_1.z.string().min(1, "Developer token is required"),
    loginCustomerId: zod_1.z.string().optional(),
});
var searchCampaignsInput = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    query: zod_1.z
        .string()
        .default("SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id DESC LIMIT 25"),
});
var createBudgetInput = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, "Budget name is required"),
    amountMicros: zod_1.z.number().min(0, "Budget must be positive"),
    deliveryMethod: zod_1.z.enum(["STANDARD", "ACCELERATED"]).default("STANDARD"),
});
var campaignMetricsInput = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    campaignId: zod_1.z.string().min(1, "Campaign ID is required"),
    dateRange: zod_1.z
        .object({
        startDate: zod_1.z.string().min(8),
        endDate: zod_1.z.string().min(8),
    })
        .default({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
    }),
});
function resolveCredentials(auth, overrideCustomerId) {
    var _a, _b, _c, _d, _e;
    var accessToken = (_a = auth.accessToken) !== null && _a !== void 0 ? _a : auth.apiKey;
    var customerId = overrideCustomerId !== null && overrideCustomerId !== void 0 ? overrideCustomerId : (_b = auth.metadata) === null || _b === void 0 ? void 0 : _b.customerId;
    var developerToken = (_c = auth.apiSecret) !== null && _c !== void 0 ? _c : (_d = auth.metadata) === null || _d === void 0 ? void 0 : _d.developerToken;
    var loginCustomerId = (_e = auth.metadata) === null || _e === void 0 ? void 0 : _e.loginCustomerId;
    var parsed = credentialsSchema.parse({
        accessToken: accessToken,
        customerId: customerId,
        developerToken: developerToken,
        loginCustomerId: loginCustomerId,
    });
    return {
        accessToken: parsed.accessToken,
        customerId: parsed.customerId,
        developerToken: parsed.developerToken,
        loginCustomerId: parsed.loginCustomerId,
    };
}
function googleAdsRequest(method, path, creds, body) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://googleads.googleapis.com/v15/".concat(path), {
                        method: method,
                        headers: __assign({ Authorization: "Bearer ".concat(creds.accessToken), "Content-Type": "application/json", "developer-token": creds.developerToken }, (creds.loginCustomerId ? { "login-customer-id": creds.loginCustomerId } : {})),
                        body: body ? JSON.stringify(body) : undefined,
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Google Ads API error ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
var GoogleAdsConnector = /** @class */ (function (_super) {
    __extends(GoogleAdsConnector, _super);
    function GoogleAdsConnector() {
        var _this = _super.call(this, {
            name: "google_ads",
            displayName: "Google Ads",
            description: "Manage Google Ads campaigns and retrieve performance metrics.",
            category: "GOOGLE_ADS",
            iconUrl: "https://www.google.com/favicon.ico",
            websiteUrl: "https://ads.google.com/home/tools/api/",
            authType: "oauth2",
            authConfig: {
                instructions: "Provide OAuth access token with Google Ads scope. Set developer token via apiSecret or metadata.developerToken and customer IDs via metadata.",
            },
        }) || this;
        _this.actions = [
            {
                id: "searchCampaigns",
                name: "Search Campaigns",
                description: "Execute a GAQL query to retrieve campaigns.",
                inputSchema: searchCampaignsInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, data;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = searchCampaignsInput.parse(input);
                                creds = resolveCredentials(auth, payload.customerId);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return googleAdsRequest("POST", "customers/".concat(creds.customerId, "/googleAds:search"), creds, { query: payload.query });
                                    })];
                            case 1:
                                data = _d.sent();
                                return [2 /*return*/, (_c = data.results) !== null && _c !== void 0 ? _c : []];
                        }
                    });
                }); },
            },
            {
                id: "createCampaignBudget",
                name: "Create Campaign Budget",
                description: "Create a shared campaign budget.",
                inputSchema: createBudgetInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createBudgetInput.parse(input);
                                creds = resolveCredentials(auth, payload.customerId);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return googleAdsRequest("POST", "customers/".concat(creds.customerId, "/campaignBudgets"), creds, {
                                            campaignBudget: {
                                                name: payload.name,
                                                amountMicros: payload.amountMicros,
                                                deliveryMethod: payload.deliveryMethod,
                                            },
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, { resourceName: result.resourceName }];
                        }
                    });
                }); },
            },
            {
                id: "getCampaignMetrics",
                name: "Get Campaign Metrics",
                description: "Fetch impressions, clicks, and conversions for a campaign.",
                inputSchema: campaignMetricsInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, query, data;
                    var _c, _d, _e;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                payload = campaignMetricsInput.parse(input);
                                creds = resolveCredentials(auth, payload.customerId);
                                query = "SELECT metrics.impressions, metrics.clicks, metrics.conversions, metrics.costMicros\nFROM campaign\nWHERE campaign.id = ".concat(payload.campaignId, "\nDURING ").concat(payload.dateRange.startDate, ",").concat(payload.dateRange.endDate);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return googleAdsRequest("POST", "customers/".concat(creds.customerId, "/googleAds:search"), creds, { query: query });
                                    })];
                            case 1:
                                data = _f.sent();
                                return [2 /*return*/, (_e = (_d = (_c = data.results) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.metrics) !== null && _e !== void 0 ? _e : {}];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    GoogleAdsConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = resolveCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                return googleAdsRequest("POST", "customers/".concat(creds_1.customerId, "/googleAds:search"), creds_1, { query: "SELECT customer.id FROM customer LIMIT 1" });
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
    return GoogleAdsConnector;
}(Connector_js_1.Connector));
exports.GoogleAdsConnector = GoogleAdsConnector;
