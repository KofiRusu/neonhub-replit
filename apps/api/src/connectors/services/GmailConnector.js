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
exports.GmailConnector = void 0;
var node_buffer_1 = require("node:buffer");
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var gmailSendInput = zod_1.z.object({
    to: zod_1.z.string().min(3, "Recipient is required"),
    subject: zod_1.z.string().optional(),
    body: zod_1.z.string().min(1, "Email body is required"),
    cc: zod_1.z.string().optional(),
    bcc: zod_1.z.string().optional(),
    from: zod_1.z.string().optional(),
});
var gmailNewEmailInput = zod_1.z.object({
    labelIds: zod_1.z.array(zod_1.z.string()).default(["INBOX"]),
    q: zod_1.z.string().optional(),
});
function gmailFetch(path_1, auth_1) {
    return __awaiter(this, arguments, void 0, function (path, auth, init) {
        var response, text;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!auth.accessToken) {
                        throw new Error("Gmail connector requires an access token");
                    }
                    return [4 /*yield*/, fetch("https://gmail.googleapis.com/".concat(path), __assign(__assign({}, init), { headers: __assign({ Authorization: "Bearer ".concat(auth.accessToken), "Content-Type": "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("Gmail API error ".concat(response.status, ": ").concat(text));
                case 3:
                    if (response.status === 204) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
function toRFC822(input) {
    var headers = [
        "To: ".concat(input.to),
        input.from ? "From: ".concat(input.from) : undefined,
        input.cc ? "Cc: ".concat(input.cc) : undefined,
        input.bcc ? "Bcc: ".concat(input.bcc) : undefined,
        input.subject ? "Subject: ".concat(input.subject) : undefined,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
    ]
        .filter(Boolean)
        .join("\r\n");
    return "".concat(headers, "\r\n\r\n").concat(input.body);
}
var GmailConnector = /** @class */ (function (_super) {
    __extends(GmailConnector, _super);
    function GmailConnector() {
        var _this = _super.call(this, {
            name: "gmail",
            displayName: "Gmail",
            description: "Send and receive email using Gmail.",
            category: "communication",
            iconUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
            websiteUrl: "https://mail.google.com",
            authType: "oauth2",
            authConfig: {
                authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
                tokenUrl: "https://oauth2.googleapis.com/token",
                scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
            },
        }) || this;
        _this.actions = [
            {
                id: "sendEmail",
                name: "Send Email",
                description: "Send an email via the authenticated Gmail account.",
                inputSchema: gmailSendInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var parsed, raw, result;
                    var _this = this;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                parsed = gmailSendInput.parse(input);
                                raw = node_buffer_1.Buffer.from(toRFC822(parsed)).toString("base64url");
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, gmailFetch("gmail/v1/users/me/messages/send", auth, {
                                                    method: "POST",
                                                    body: JSON.stringify({ raw: raw }),
                                                })];
                                        });
                                    }); })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, result];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [
            {
                id: "newEmail",
                name: "New Email",
                description: "Triggers when a new email appears in the selected labels.",
                pollingIntervalSeconds: 120,
                inputSchema: gmailNewEmailInput,
                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var parsed, params, _i, _c, label, list, items;
                    var _this = this;
                    var _d;
                    var auth = _b.auth, settings = _b.settings, cursor = _b.cursor;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                parsed = gmailNewEmailInput.parse(settings !== null && settings !== void 0 ? settings : {});
                                params = new URLSearchParams({
                                    maxResults: "10",
                                });
                                for (_i = 0, _c = parsed.labelIds; _i < _c.length; _i++) {
                                    label = _c[_i];
                                    params.append("labelIds", label);
                                }
                                if (parsed.q)
                                    params.set("q", parsed.q);
                                if (cursor)
                                    params.set("pageToken", cursor);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, gmailFetch("gmail/v1/users/me/messages?".concat(params.toString()), auth, {
                                                    method: "GET",
                                                    headers: {
                                                        Accept: "application/json",
                                                    },
                                                })];
                                        });
                                    }); })];
                            case 1:
                                list = _e.sent();
                                items = (_d = list.messages) !== null && _d !== void 0 ? _d : [];
                                return [2 /*return*/, {
                                        cursor: list.nextPageToken || cursor || null,
                                        items: items,
                                    }];
                        }
                    });
                }); },
            },
        ];
        return _this;
    }
    GmailConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, gmailFetch("gmail/v1/users/me/profile", auth, { method: "GET" })];
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
    return GmailConnector;
}(Connector_js_1.Connector));
exports.GmailConnector = GmailConnector;
