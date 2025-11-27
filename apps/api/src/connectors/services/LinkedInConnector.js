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
exports.LinkedInConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var credentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "LinkedIn access token is required"),
    organizationUrn: zod_1.z.string().min(1, "Organization URN is required"),
    adAccountUrn: zod_1.z.string().optional(),
});
var shareUpdateInput = zod_1.z.object({
    organizationUrn: zod_1.z.string().optional(),
    text: zod_1.z.string().min(1, "Share text is required"),
    media: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
    }))
        .default([]),
    visibility: zod_1.z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
});
var createCampaignInput = zod_1.z.object({
    adAccountUrn: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, "Campaign name is required"),
    objectiveType: zod_1.z.enum(["BRAND_AWARENESS", "LEAD_GENERATION", "WEBSITE_VISITS"]).default("LEAD_GENERATION"),
    dailyBudget: zod_1.z.number().positive("Daily budget must be positive"),
    startDate: zod_1.z.string().min(8),
    endDate: zod_1.z.string().min(8).optional(),
});
var shareStatsInput = zod_1.z.object({
    organizationUrn: zod_1.z.string().optional(),
    start: zod_1.z.number().int().optional(),
    end: zod_1.z.number().int().optional(),
});
function resolveCredentials(auth, overrides) {
    var _a, _b, _c, _d, _e;
    var accessToken = (_a = auth.accessToken) !== null && _a !== void 0 ? _a : auth.apiKey;
    var organizationUrn = (_b = overrides === null || overrides === void 0 ? void 0 : overrides.organizationUrn) !== null && _b !== void 0 ? _b : (_c = auth.metadata) === null || _c === void 0 ? void 0 : _c.organizationUrn;
    var adAccountUrn = (_d = overrides === null || overrides === void 0 ? void 0 : overrides.adAccountUrn) !== null && _d !== void 0 ? _d : (_e = auth.metadata) === null || _e === void 0 ? void 0 : _e.adAccountUrn;
    var parsed = credentialsSchema.parse({ accessToken: accessToken, organizationUrn: organizationUrn, adAccountUrn: adAccountUrn });
    return {
        accessToken: parsed.accessToken,
        organizationUrn: parsed.organizationUrn,
        adAccountUrn: parsed.adAccountUrn,
    };
}
function linkedinRequest(creds, input) {
    return __awaiter(this, void 0, void 0, function () {
        var targetUrl, headers, response;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    targetUrl = new URL(input.url);
                    if (input.query) {
                        targetUrl.search = input.query.toString();
                    }
                    headers = {
                        Authorization: "Bearer ".concat(creds.accessToken),
                        "Content-Type": "application/json",
                    };
                    if (input.rest) {
                        headers["X-Restli-Protocol-Version"] = "2.0.0";
                    }
                    return [4 /*yield*/, fetch(targetUrl.toString(), {
                            method: (_a = input.method) !== null && _a !== void 0 ? _a : "POST",
                            headers: headers,
                            body: input.body ? JSON.stringify(input.body) : undefined,
                        })];
                case 1:
                    response = _b.sent();
                    if (!response.ok) {
                        throw new Error("LinkedIn API error ".concat(response.status));
                    }
                    if (response.status === 204) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, (_b.sent())];
            }
        });
    });
}
var LinkedInConnector = /** @class */ (function (_super) {
    __extends(LinkedInConnector, _super);
    function LinkedInConnector() {
        var _this = _super.call(this, {
            name: "linkedin",
            displayName: "LinkedIn",
            description: "Publish organic updates and manage advertising campaigns on LinkedIn.",
            category: "LINKEDIN",
            iconUrl: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
            websiteUrl: "https://www.linkedin.com/developers/",
            authType: "oauth2",
            authConfig: {
                instructions: "Provide a LinkedIn Marketing Developer access token. Set organization/ad account URNs via metadata.",
            },
        }) || this;
        _this.actions = [
            {
                id: "shareUpdate",
                name: "Share Update",
                description: "Publish an organization update to the company page feed.",
                inputSchema: shareUpdateInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, body, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = shareUpdateInput.parse(input);
                                creds = resolveCredentials(auth, { organizationUrn: payload.organizationUrn });
                                body = {
                                    author: creds.organizationUrn,
                                    lifecycleState: "PUBLISHED",
                                    specificContent: {
                                        "com.linkedin.ugc.ShareContent": {
                                            shareCommentary: { text: payload.text },
                                            shareMediaCategory: payload.media.length > 0 ? "ARTICLE" : "NONE",
                                            media: payload.media.map(function (item) { return ({
                                                status: "READY",
                                                originalUrl: item.url,
                                                title: item.title ? { text: item.title } : undefined,
                                                description: item.description ? { text: item.description } : undefined,
                                            }); }),
                                        },
                                    },
                                    visibility: {
                                        "com.linkedin.ugc.MemberNetworkVisibility": payload.visibility,
                                    },
                                };
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return linkedinRequest(creds, {
                                            url: "https://api.linkedin.com/v2/ugcPosts",
                                            body: body,
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, { postUrn: result.id }];
                        }
                    });
                }); },
            },
            {
                id: "createAdCampaign",
                name: "Create Ad Campaign",
                description: "Create a Sponsored Content campaign within the ad account.",
                inputSchema: createCampaignInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createCampaignInput.parse(input);
                                creds = resolveCredentials(auth, {
                                    adAccountUrn: payload.adAccountUrn,
                                });
                                if (!creds.adAccountUrn) {
                                    throw new Error("LinkedIn ad account URN is required (metadata.adAccountUrn or input.adAccountUrn)");
                                }
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return linkedinRequest(creds, {
                                            url: "https://api.linkedin.com/rest/adCampaigns",
                                            rest: true,
                                            body: {
                                                account: creds.adAccountUrn,
                                                name: payload.name,
                                                objectiveType: payload.objectiveType,
                                                dailyBudget: {
                                                    currencyCode: "USD",
                                                    amount: payload.dailyBudget,
                                                },
                                                startDate: payload.startDate,
                                                endDate: payload.endDate,
                                                status: "ACTIVE",
                                            },
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, { campaignUrn: result.id }];
                        }
                    });
                }); },
            },
            {
                id: "getShareStatistics",
                name: "Get Share Statistics",
                description: "Retrieve aggregated share statistics for the organization.",
                inputSchema: shareStatsInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, params, result;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = shareStatsInput.parse(input);
                                creds = resolveCredentials(auth, { organizationUrn: payload.organizationUrn });
                                params = new URLSearchParams();
                                params.set("q", "organizationalEntity");
                                params.set("organizationalEntity", creds.organizationUrn);
                                if (payload.start)
                                    params.set("timeIntervals.timeGranularityType", "DAY");
                                if (payload.start)
                                    params.set("timeIntervals.timeRange.start", String(payload.start));
                                if (payload.end)
                                    params.set("timeIntervals.timeRange.end", String(payload.end));
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return linkedinRequest(creds, {
                                            url: "https://api.linkedin.com/v2/organizationalEntityShareStatistics",
                                            method: "GET",
                                            query: params,
                                        });
                                    })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, (_c = result.elements) !== null && _c !== void 0 ? _c : []];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    LinkedInConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = resolveCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                return linkedinRequest(creds_1, {
                                    url: "https://api.linkedin.com/v2/organizations",
                                    method: "GET",
                                    query: new URLSearchParams({
                                        q: "organization",
                                        organization: creds_1.organizationUrn,
                                    }),
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
    return LinkedInConnector;
}(Connector_js_1.Connector));
exports.LinkedInConnector = LinkedInConnector;
