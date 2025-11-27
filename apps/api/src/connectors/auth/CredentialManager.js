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
exports.connectorCredentialManager = exports.ConnectorCredentialManager = void 0;
var prisma_js_1 = require("../../db/prisma.js");
var encryption_js_1 = require("../../lib/encryption.js");
function maybeEncrypt(value) {
    if (!value)
        return null;
    return (0, encryption_js_1.encrypt)(value);
}
function maybeDecrypt(value) {
    if (!value)
        return undefined;
    return (0, encryption_js_1.decrypt)(value);
}
function toJsonValue(data) {
    return (data !== null && data !== void 0 ? data : {});
}
function jsonToRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
var ConnectorCredentialManager = /** @class */ (function () {
    function ConnectorCredentialManager() {
    }
    ConnectorCredentialManager.prototype.save = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var encryptedAccessToken, encryptedRefreshToken, encryptedApiKey, encryptedApiSecret, metadata, timestamp;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                encryptedAccessToken = maybeEncrypt(params.accessToken);
                encryptedRefreshToken = maybeEncrypt(params.refreshToken);
                encryptedApiKey = maybeEncrypt(params.apiKey);
                encryptedApiSecret = maybeEncrypt(params.apiSecret);
                metadata = toJsonValue(params.metadata);
                timestamp = new Date();
                return [2 /*return*/, prisma_js_1.prisma.connectorAuth.upsert({
                        where: {
                            userId_connectorId_accountId: {
                                userId: params.userId,
                                connectorId: params.connectorId,
                                accountId: (_a = params.accountId) !== null && _a !== void 0 ? _a : null,
                            },
                        },
                        update: {
                            accountId: (_b = params.accountId) !== null && _b !== void 0 ? _b : null,
                            accountName: (_c = params.accountName) !== null && _c !== void 0 ? _c : null,
                            accessToken: encryptedAccessToken,
                            refreshToken: encryptedRefreshToken,
                            apiKey: encryptedApiKey,
                            apiSecret: encryptedApiSecret,
                            scope: (_d = params.scope) !== null && _d !== void 0 ? _d : null,
                            tokenType: (_e = params.tokenType) !== null && _e !== void 0 ? _e : null,
                            expiresAt: (_f = params.expiresAt) !== null && _f !== void 0 ? _f : null,
                            metadata: metadata,
                            status: "active",
                            lastUsedAt: timestamp,
                            updatedAt: timestamp,
                            connectorKind: params.connectorKind,
                        },
                        create: {
                            userId: params.userId,
                            connectorId: params.connectorId,
                            connectorKind: params.connectorKind,
                            accountId: (_g = params.accountId) !== null && _g !== void 0 ? _g : null,
                            accountName: (_h = params.accountName) !== null && _h !== void 0 ? _h : null,
                            accessToken: encryptedAccessToken,
                            refreshToken: encryptedRefreshToken,
                            apiKey: encryptedApiKey,
                            apiSecret: encryptedApiSecret,
                            scope: (_j = params.scope) !== null && _j !== void 0 ? _j : null,
                            tokenType: (_k = params.tokenType) !== null && _k !== void 0 ? _k : null,
                            expiresAt: (_l = params.expiresAt) !== null && _l !== void 0 ? _l : null,
                            metadata: metadata,
                            status: "active",
                            lastUsedAt: timestamp,
                        },
                    })];
            });
        });
    };
    ConnectorCredentialManager.prototype.get = function (userId, connectorId, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var auth;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.connectorAuth.findFirst({
                            where: __assign({ userId: userId, connectorId: connectorId, status: "active" }, (accountId !== undefined ? { accountId: accountId !== null && accountId !== void 0 ? accountId : "" } : {})),
                        })];
                    case 1:
                        auth = _b.sent();
                        if (!auth)
                            return [2 /*return*/, null];
                        return [2 /*return*/, __assign(__assign({}, auth), { accessToken: maybeDecrypt(auth.accessToken), refreshToken: maybeDecrypt(auth.refreshToken), apiKey: maybeDecrypt(auth.apiKey), apiSecret: maybeDecrypt(auth.apiSecret), metadata: (_a = jsonToRecord(auth.metadata)) !== null && _a !== void 0 ? _a : null })];
                }
            });
        });
    };
    ConnectorCredentialManager.prototype.toContext = function (userId, connectorId, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var auth;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.get(userId, connectorId, accountId)];
                    case 1:
                        auth = _f.sent();
                        if (!auth)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                accessToken: (_a = auth.accessToken) !== null && _a !== void 0 ? _a : undefined,
                                refreshToken: (_b = auth.refreshToken) !== null && _b !== void 0 ? _b : undefined,
                                apiKey: (_c = auth.apiKey) !== null && _c !== void 0 ? _c : undefined,
                                apiSecret: (_d = auth.apiSecret) !== null && _d !== void 0 ? _d : undefined,
                                metadata: (_e = auth.metadata) !== null && _e !== void 0 ? _e : undefined,
                            }];
                }
            });
        });
    };
    ConnectorCredentialManager.prototype.listMasked = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var auths;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.connectorAuth.findMany({
                            where: { userId: userId },
                            orderBy: { createdAt: "desc" },
                        })];
                    case 1:
                        auths = _a.sent();
                        return [2 /*return*/, auths.map(function (auth) {
                                var _a;
                                return (__assign(__assign({}, auth), { metadata: (_a = jsonToRecord(auth.metadata)) !== null && _a !== void 0 ? _a : null, accessToken: undefined, refreshToken: undefined, apiKey: undefined, apiSecret: undefined, accessTokenMasked: auth.accessToken ? (0, encryption_js_1.maskToken)(maybeDecrypt(auth.accessToken) || "") : undefined, refreshTokenMasked: auth.refreshToken ? (0, encryption_js_1.maskToken)(maybeDecrypt(auth.refreshToken) || "") : undefined, apiKeyMasked: auth.apiKey ? (0, encryption_js_1.maskToken)(maybeDecrypt(auth.apiKey) || "") : undefined, apiSecretMasked: auth.apiSecret ? (0, encryption_js_1.maskToken)(maybeDecrypt(auth.apiSecret) || "") : undefined }));
                            })];
                }
            });
        });
    };
    ConnectorCredentialManager.prototype.revoke = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.connectorAuth.update({
                            where: { id: id },
                            data: { status: "revoked", updatedAt: new Date() },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConnectorCredentialManager.prototype.remove = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.connectorAuth.delete({
                            where: { id: id },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ConnectorCredentialManager;
}());
exports.ConnectorCredentialManager = ConnectorCredentialManager;
exports.connectorCredentialManager = new ConnectorCredentialManager();
