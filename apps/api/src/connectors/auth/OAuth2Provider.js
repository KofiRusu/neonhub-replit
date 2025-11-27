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
exports.OAuth2Provider = void 0;
var crypto_1 = require("crypto");
var url_1 = require("url");
var OAuth2Provider = /** @class */ (function () {
    function OAuth2Provider(config) {
        this.config = config;
    }
    OAuth2Provider.prototype.buildAuthorizeUrl = function (state, codeChallenge) {
        var params = new url_1.URLSearchParams({
            client_id: this.config.clientId,
            response_type: "code",
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(" "),
            state: state,
        });
        if (this.config.audience) {
            params.set("audience", this.config.audience);
        }
        if (codeChallenge) {
            params.set("code_challenge", codeChallenge);
            params.set("code_challenge_method", "S256");
        }
        if (this.config.extraAuthorizeParams) {
            for (var _i = 0, _a = Object.entries(this.config.extraAuthorizeParams); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                params.set(key, value);
            }
        }
        return "".concat(this.config.authorizeUrl, "?").concat(params.toString());
    };
    OAuth2Provider.prototype.getAuthorizationRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var state, url;
            return __generator(this, function (_a) {
                state = (0, crypto_1.randomBytes)(16).toString("hex");
                url = this.buildAuthorizeUrl(state);
                return [2 /*return*/, { url: url, state: state }];
            });
        });
    };
    OAuth2Provider.prototype.exchangeCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var body, response, text, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = new url_1.URLSearchParams({
                            grant_type: "authorization_code",
                            code: code,
                            redirect_uri: this.config.redirectUri,
                            client_id: this.config.clientId,
                            client_secret: this.config.clientSecret,
                        });
                        return [4 /*yield*/, fetch(this.config.tokenUrl, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: body.toString(),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error("OAuth2 token exchange failed (".concat(response.status, "): ").concat(text));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        payload = (_a.sent());
                        return [2 /*return*/, payload];
                }
            });
        });
    };
    OAuth2Provider.prototype.refreshToken = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            var body, response, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = new url_1.URLSearchParams({
                            grant_type: "refresh_token",
                            refresh_token: refreshToken,
                            client_id: this.config.clientId,
                            client_secret: this.config.clientSecret,
                        });
                        return [4 /*yield*/, fetch(this.config.tokenUrl, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: body.toString(),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error("OAuth2 refresh failed (".concat(response.status, "): ").concat(text));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    /**
     * Check if an access token is expired or will expire soon (within 5 minutes)
     */
    OAuth2Provider.prototype.isTokenExpired = function (expiresAt) {
        if (!expiresAt) {
            // No expiry data - assume valid
            return false;
        }
        var now = new Date();
        var bufferMs = 5 * 60 * 1000; // 5 minutes
        return expiresAt.getTime() - now.getTime() < bufferMs;
    };
    return OAuth2Provider;
}());
exports.OAuth2Provider = OAuth2Provider;
