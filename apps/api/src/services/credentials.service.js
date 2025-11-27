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
exports.credentialService = exports.CredentialService = void 0;
var prisma_js_1 = require("../db/prisma.js");
var encryption_js_1 = require("../lib/encryption.js");
var CredentialService = /** @class */ (function () {
    function CredentialService() {
    }
    /**
     * Save or update a credential with encryption
     */
    CredentialService.prototype.saveCredential = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var encrypted;
            return __generator(this, function (_a) {
                encrypted = {
                    userId: params.userId,
                    provider: params.provider,
                    accountId: params.accountId || '',
                    accessToken: params.accessToken ? (0, encryption_js_1.encrypt)(params.accessToken) : null,
                    refreshToken: params.refreshToken ? (0, encryption_js_1.encrypt)(params.refreshToken) : null,
                    accessSecret: params.accessSecret ? (0, encryption_js_1.encrypt)(params.accessSecret) : null,
                    scope: params.scope || null,
                    tokenType: params.tokenType || null,
                    expiresAt: params.expiresAt || null,
                    status: 'active',
                };
                return [2 /*return*/, prisma_js_1.prisma.credential.upsert({
                        where: {
                            userId_provider_accountId: {
                                userId: params.userId,
                                provider: params.provider,
                                accountId: params.accountId || '',
                            },
                        },
                        create: encrypted,
                        update: encrypted,
                    })];
            });
        });
    };
    /**
     * Get a decrypted credential (internal use only)
     */
    CredentialService.prototype.getCredential = function (userId, provider, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var where, cred;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        where = {
                            userId: userId,
                            provider: provider,
                            status: 'active'
                        };
                        if (accountId !== undefined) {
                            where.accountId = accountId;
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.credential.findFirst({ where: where })];
                    case 1:
                        cred = _a.sent();
                        if (!cred)
                            return [2 /*return*/, null];
                        return [2 /*return*/, __assign(__assign({}, cred), { accessToken: cred.accessToken ? (0, encryption_js_1.decrypt)(cred.accessToken) : undefined, refreshToken: cred.refreshToken ? (0, encryption_js_1.decrypt)(cred.refreshToken) : undefined, accessSecret: cred.accessSecret ? (0, encryption_js_1.decrypt)(cred.accessSecret) : undefined })];
                }
            });
        });
    };
    /**
     * Get masked credentials for API responses (safe for external use)
     */
    CredentialService.prototype.getMaskedCredentials = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var credentials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.findMany({
                            where: { userId: userId },
                            orderBy: { createdAt: 'desc' },
                        })];
                    case 1:
                        credentials = _a.sent();
                        return [2 /*return*/, credentials.map(function (cred) { return (__assign(__assign({}, cred), { accessToken: cred.accessToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessToken)) : undefined, refreshToken: cred.refreshToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.refreshToken)) : undefined, accessSecret: cred.accessSecret ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessSecret)) : undefined })); })];
                }
            });
        });
    };
    /**
     * Get a masked credential for a specific provider
     */
    CredentialService.prototype.getMaskedCredential = function (userId, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var cred;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.findFirst({
                            where: { userId: userId, provider: provider, status: 'active' },
                        })];
                    case 1:
                        cred = _a.sent();
                        if (!cred)
                            return [2 /*return*/, null];
                        return [2 /*return*/, __assign(__assign({}, cred), { accessToken: cred.accessToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessToken)) : undefined, refreshToken: cred.refreshToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.refreshToken)) : undefined, accessSecret: cred.accessSecret ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessSecret)) : undefined })];
                }
            });
        });
    };
    /**
     * Revoke a credential
     */
    CredentialService.prototype.revokeCredential = function (userId, provider) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.updateMany({
                            where: { userId: userId, provider: provider },
                            data: {
                                status: 'revoked',
                                updatedAt: new Date(),
                            },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a credential permanently
     */
    CredentialService.prototype.deleteCredential = function (userId, provider) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.deleteMany({
                            where: { userId: userId, provider: provider },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a credential needs refresh (expires within 5 minutes)
     */
    CredentialService.prototype.needsRefresh = function (credential) {
        if (!credential.expiresAt)
            return false;
        var fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        return credential.expiresAt < fiveMinutesFromNow;
    };
    /**
     * Update last used timestamp
     */
    CredentialService.prototype.markAsUsed = function (credentialId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.update({
                            where: { id: credentialId },
                            data: { lastUsedAt: new Date() },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mark credential as expired
     */
    CredentialService.prototype.markAsExpired = function (credentialId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.update({
                            where: { id: credentialId },
                            data: { status: 'expired' },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all credentials for a user by status
     */
    CredentialService.prototype.getCredentialsByStatus = function (userId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var credentials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.credential.findMany({
                            where: { userId: userId, status: status },
                            orderBy: { createdAt: 'desc' },
                        })];
                    case 1:
                        credentials = _a.sent();
                        return [2 /*return*/, credentials.map(function (cred) { return (__assign(__assign({}, cred), { accessToken: cred.accessToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessToken)) : undefined, refreshToken: cred.refreshToken ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.refreshToken)) : undefined, accessSecret: cred.accessSecret ? (0, encryption_js_1.maskToken)((0, encryption_js_1.decrypt)(cred.accessSecret)) : undefined })); })];
                }
            });
        });
    };
    return CredentialService;
}());
exports.CredentialService = CredentialService;
exports.credentialService = new CredentialService();
