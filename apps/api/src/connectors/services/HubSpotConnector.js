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
exports.HubSpotConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var createContactSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
});
var searchContactSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
function hubspotFetch(auth_1, path_1) {
    return __awaiter(this, arguments, void 0, function (auth, path, init) {
        var token, response, text;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = auth.accessToken || auth.apiKey;
                    if (!token)
                        throw new Error("HubSpot connector requires an access token");
                    return [4 /*yield*/, fetch("https://api.hubapi.com/".concat(path), __assign(__assign({}, init), { headers: __assign({ Authorization: "Bearer ".concat(token), "Content-Type": "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("HubSpot API error ".concat(response.status, ": ").concat(text));
                case 3: return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
var HubSpotConnector = /** @class */ (function (_super) {
    __extends(HubSpotConnector, _super);
    function HubSpotConnector() {
        var _this = _super.call(this, {
            name: "hubspot",
            displayName: "HubSpot",
            description: "Create and manage contacts in HubSpot CRM.",
            category: "crm",
            iconUrl: "https://static.hsappstatic.net/ui-addon-upgrades/static-4.15816/img/favicon.ico",
            websiteUrl: "https://hubspot.com",
            authType: "oauth2",
            authConfig: {
                authorizeUrl: "https://app.hubspot.com/oauth/authorize",
                tokenUrl: "https://api.hubapi.com/oauth/v1/token",
                scopes: ["contacts", "crm.objects.contacts.read", "crm.objects.contacts.write"],
            },
        }) || this;
        _this.actions = [
            {
                id: "createContact",
                name: "Create Contact",
                description: "Create a contact in HubSpot.",
                inputSchema: createContactSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        payload = createContactSchema.parse(input);
                        return [2 /*return*/, RetryManager_js_1.retryManager.run(function () {
                                return hubspotFetch(auth, "crm/v3/objects/contacts", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        properties: {
                                            email: payload.email,
                                            firstname: payload.firstName,
                                            lastname: payload.lastName,
                                            phone: payload.phone,
                                            company: payload.company,
                                            website: payload.website,
                                        },
                                    }),
                                });
                            })];
                    });
                }); },
            },
        ];
        _this.triggers = [
            {
                id: "contactCreated",
                name: "New Contact",
                description: "Triggers when a new contact is created.",
                pollingIntervalSeconds: 300,
                inputSchema: zod_1.z.object({
                    limit: zod_1.z.number().min(1).max(100).default(20),
                }),
                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var limit, params, result;
                    var _c, _d, _e, _f;
                    var auth = _b.auth, cursor = _b.cursor, settings = _b.settings;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0:
                                limit = (_c = settings === null || settings === void 0 ? void 0 : settings.limit) !== null && _c !== void 0 ? _c : 20;
                                params = new URLSearchParams({
                                    limit: String(limit),
                                    sort: "-createdate",
                                });
                                if (cursor)
                                    params.set("after", cursor);
                                return [4 /*yield*/, hubspotFetch(auth, "crm/v3/objects/contacts?".concat(params.toString()), { method: "GET" })];
                            case 1:
                                result = _g.sent();
                                return [2 /*return*/, {
                                        cursor: (_f = (_e = (_d = result.paging) === null || _d === void 0 ? void 0 : _d.next) === null || _e === void 0 ? void 0 : _e.after) !== null && _f !== void 0 ? _f : null,
                                        items: result.results,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "findContactByEmail",
                name: "Find Contact By Email",
                description: "Look up a contact by email address.",
                inputSchema: searchContactSchema,
                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, result;
                    var auth = _b.auth, settings = _b.settings;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = searchContactSchema.parse(settings !== null && settings !== void 0 ? settings : {});
                                return [4 /*yield*/, hubspotFetch(auth, "crm/v3/objects/contacts/search", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            filterGroups: [
                                                {
                                                    filters: [
                                                        {
                                                            propertyName: "email",
                                                            operator: "EQ",
                                                            value: payload.email,
                                                        },
                                                    ],
                                                },
                                            ],
                                        }),
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, {
                                        cursor: null,
                                        items: result.results,
                                    }];
                        }
                    });
                }); },
            },
        ];
        return _this;
    }
    HubSpotConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var token, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        token = auth.accessToken || auth.apiKey;
                        if (!token)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, hubspotFetch(auth, "oauth/v1/access-tokens/".concat(token), { method: "GET" })];
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
    return HubSpotConnector;
}(Connector_js_1.Connector));
exports.HubSpotConnector = HubSpotConnector;
