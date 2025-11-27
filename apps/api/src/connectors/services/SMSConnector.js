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
exports.SMSConnector = void 0;
var node_buffer_1 = require("node:buffer");
var node_url_1 = require("node:url");
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var smsSendInput = zod_1.z.object({
    to: zod_1.z.string().min(1, "Recipient phone number is required"),
    message: zod_1.z.string().min(1, "Message body is required"),
    from: zod_1.z.string().optional(),
    statusCallbackUrl: zod_1.z.string().url().optional(),
});
var smsStatusInput = zod_1.z.object({
    messageId: zod_1.z.string().min(1, "Message SID is required"),
});
var smsMetadataSchema = zod_1.z.object({
    accountSid: zod_1.z.string().min(1).optional(),
    authToken: zod_1.z.string().min(1).optional(),
    fromNumber: zod_1.z.string().min(1).optional(),
});
function resolveTwilioCredentials(auth) {
    var _a, _b, _c, _d;
    var metadata = smsMetadataSchema.parse((_a = auth.metadata) !== null && _a !== void 0 ? _a : {});
    var accountSid = (_b = auth.apiKey) !== null && _b !== void 0 ? _b : metadata.accountSid;
    var authToken = (_d = (_c = auth.apiSecret) !== null && _c !== void 0 ? _c : auth.accessToken) !== null && _d !== void 0 ? _d : metadata.authToken;
    if (!accountSid) {
        throw new Error("SMS connector requires a Twilio account SID (provide via apiKey or metadata.accountSid)");
    }
    if (!authToken) {
        throw new Error("SMS connector requires a Twilio auth token (provide via apiSecret, accessToken, or metadata.authToken)");
    }
    return {
        accountSid: accountSid,
        authToken: authToken,
        defaultFrom: metadata.fromNumber,
    };
}
function twilioRequest(creds_1, path_1) {
    return __awaiter(this, arguments, void 0, function (creds, path, init) {
        var url, response, detail, _a, message;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    url = new URL("https://api.twilio.com/2010-04-01/Accounts/".concat(creds.accountSid, "/").concat(path));
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, init), { headers: __assign({ Authorization: "Basic ".concat(node_buffer_1.Buffer.from("".concat(creds.accountSid, ":").concat(creds.authToken)).toString("base64")), Accept: "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 6];
                    detail = void 0;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, response.text()];
                case 3:
                    detail = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    detail = undefined;
                    return [3 /*break*/, 5];
                case 5:
                    message = detail ? "Twilio API error ".concat(response.status, ": ").concat(detail) : "Twilio API error ".concat(response.status);
                    throw new Error(message);
                case 6:
                    if (response.status === 204) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, response.json()];
                case 7: return [2 /*return*/, (_b.sent())];
            }
        });
    });
}
var SMSConnector = /** @class */ (function (_super) {
    __extends(SMSConnector, _super);
    function SMSConnector() {
        var _this = _super.call(this, {
            name: "sms",
            displayName: "SMS",
            description: "Send transactional and marketing SMS messages via Twilio.",
            category: "communication",
            iconUrl: "https://www.twilio.com/docs/static/img/favicons/favicon-32x32.png",
            websiteUrl: "https://www.twilio.com",
            authType: "api_key",
            authConfig: {
                instructions: "Provide your Twilio Account SID as the API key and Auth Token as the API secret. Optionally supply a default From number via metadata.fromNumber.",
            },
        }) || this;
        _this.actions = [
            {
                id: "sendSms",
                name: "Send SMS",
                description: "Deliver an SMS message using your Twilio messaging credentials.",
                inputSchema: smsSendInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, fromNumber, bodyParams, result;
                    var _this = this;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = smsSendInput.parse(input);
                                creds = resolveTwilioCredentials(auth);
                                fromNumber = (_c = payload.from) !== null && _c !== void 0 ? _c : creds.defaultFrom;
                                if (!fromNumber) {
                                    throw new Error("SMS connector requires a from number (provide in input.from or metadata.fromNumber)");
                                }
                                bodyParams = new node_url_1.URLSearchParams();
                                bodyParams.set("To", payload.to);
                                bodyParams.set("From", fromNumber);
                                bodyParams.set("Body", payload.message);
                                if (payload.statusCallbackUrl) {
                                    bodyParams.set("StatusCallback", payload.statusCallbackUrl);
                                }
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, twilioRequest(creds, "Messages.json", {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/x-www-form-urlencoded",
                                                    },
                                                    body: bodyParams.toString(),
                                                })];
                                        });
                                    }); })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, {
                                        messageId: result.sid,
                                        status: result.status,
                                        to: result.to,
                                        from: result.from,
                                        createdAt: result.dateCreated,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "getMessageStatus",
                name: "Get Message Status",
                description: "Fetch the latest delivery status for a previously sent SMS.",
                inputSchema: smsStatusInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var _this = this;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = smsStatusInput.parse(input);
                                creds = resolveTwilioCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, twilioRequest(creds, "Messages/".concat(encodeURIComponent(payload.messageId), ".json"))];
                                        });
                                    }); })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, {
                                        messageId: result.sid,
                                        status: result.status,
                                        to: result.to,
                                        from: result.from,
                                        errorCode: result.errorCode,
                                        errorMessage: result.errorMessage,
                                        segments: Number((_c = result.numSegments) !== null && _c !== void 0 ? _c : "0"),
                                        updatedAt: result.dateUpdated,
                                    }];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    SMSConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds = resolveTwilioCredentials(auth);
                        return [4 /*yield*/, twilioRequest(creds, "Messages.json?PageSize=1", { method: "GET" })];
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
    return SMSConnector;
}(Connector_js_1.Connector));
exports.SMSConnector = SMSConnector;
