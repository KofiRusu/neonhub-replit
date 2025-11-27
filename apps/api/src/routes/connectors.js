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
exports.connectorsRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var http_js_1 = require("../lib/http.js");
var index_js_1 = require("../connectors/index.js");
var CredentialManager_js_1 = require("../connectors/auth/CredentialManager.js");
var ActionHandler_js_1 = require("../connectors/execution/ActionHandler.js");
var TriggerHandler_js_1 = require("../connectors/execution/TriggerHandler.js");
var OAuth2Provider_js_1 = require("../connectors/auth/OAuth2Provider.js");
var connector_service_js_1 = require("../services/connector.service.js");
exports.connectorsRouter = (0, express_1.Router)();
var apiKeySchema = zod_1.z.object({
    apiKey: zod_1.z.string().min(1).optional(),
    apiSecret: zod_1.z.string().min(1).optional(),
    accessToken: zod_1.z.string().min(1).optional(),
    refreshToken: zod_1.z.string().optional(),
    accountId: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var actionRequestSchema = zod_1.z.object({
    input: zod_1.z.unknown(),
    accountId: zod_1.z.string().optional(),
});
var triggerRequestSchema = zod_1.z.object({
    settings: zod_1.z.unknown().optional(),
    cursor: zod_1.z.string().optional().nullable(),
    accountId: zod_1.z.string().optional(),
});
var oauthCallbackSchema = zod_1.z.object({
    code: zod_1.z.string(),
    state: zod_1.z.string().optional(),
});
var oauthEnvMap = {
    slack: {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri: process.env.SLACK_REDIRECT_URI,
    },
    gmail: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    google_sheets: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    notion: {
        clientId: process.env.NOTION_CLIENT_ID,
        clientSecret: process.env.NOTION_CLIENT_SECRET,
        redirectUri: process.env.NOTION_REDIRECT_URI,
    },
    asana: {
        clientId: process.env.ASANA_CLIENT_ID,
        clientSecret: process.env.ASANA_CLIENT_SECRET,
        redirectUri: process.env.ASANA_REDIRECT_URI,
    },
    hubspot: {
        clientId: process.env.HUBSPOT_CLIENT_ID,
        clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
        redirectUri: process.env.HUBSPOT_REDIRECT_URI,
    },
};
function requireOAuthConfig(name, authConfig) {
    var _a;
    var envConfig = oauthEnvMap[name];
    if (!envConfig || !envConfig.clientId || !envConfig.clientSecret || !envConfig.redirectUri) {
        throw new Error("OAuth configuration missing for ".concat(name, ". Check environment variables."));
    }
    return {
        authorizeUrl: authConfig.authorizeUrl,
        tokenUrl: authConfig.tokenUrl,
        scopes: (_a = authConfig.scopes) !== null && _a !== void 0 ? _a : [],
        clientId: envConfig.clientId,
        clientSecret: envConfig.clientSecret,
        redirectUri: envConfig.redirectUri,
    };
}
var connectorsInitialised = false;
function normalizeRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
function ensureConnectorsLoaded() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connectorsInitialised)
                        return [2 /*return*/];
                    return [4 /*yield*/, (0, index_js_1.registerConnectors)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, connector_service_js_1.syncRegisteredConnectors)()];
                case 2:
                    _a.sent();
                    connectorsInitialised = true;
                    return [2 /*return*/];
            }
        });
    });
}
exports.connectorsRouter.get("/", auth_js_1.requireAuth, function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connectors, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, ensureConnectorsLoaded()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, connector_service_js_1.listConnectors)()];
            case 2:
                connectors = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(connectors))];
            case 3:
                error_1 = _a.sent();
                message = error_1 instanceof Error ? error_1.message : "Failed to list connectors";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.get("/auth", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var auths, error_2, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, connector_service_js_1.listConnectorAuths)(req.user.id)];
            case 1:
                auths = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(auths))];
            case 2:
                error_2 = _a.sent();
                message = error_2 instanceof Error ? error_2.message : "Failed to list connector authorisations";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/oauth/start", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, connectorKind, oauthConfig, provider, _a, url, state, error_3, message;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                if (connector.metadata.authType !== "oauth2") {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Connector does not support OAuth2").body)];
                }
                connectorKind = connector.metadata.category;
                oauthConfig = requireOAuthConfig(connector.metadata.name, (_b = connector.metadata.authConfig) !== null && _b !== void 0 ? _b : {});
                provider = new OAuth2Provider_js_1.OAuth2Provider(oauthConfig);
                return [4 /*yield*/, provider.getAuthorizationRequest()];
            case 1:
                _a = _c.sent(), url = _a.url, state = _a.state;
                return [2 /*return*/, res.json((0, http_js_1.ok)({ url: url, state: state }))];
            case 2:
                error_3 = _c.sent();
                message = error_3 instanceof Error ? error_3.message : "Failed to start OAuth flow";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/oauth/callback", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, connectorKind, payload, oauthConfig, provider, tokens, error_4, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                if (connector.metadata.authType !== "oauth2") {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Connector does not support OAuth2").body)];
                }
                connectorKind = connector.metadata.category;
                payload = oauthCallbackSchema.parse(req.body);
                oauthConfig = requireOAuthConfig(connector.metadata.name, (_a = connector.metadata.authConfig) !== null && _a !== void 0 ? _a : {});
                provider = new OAuth2Provider_js_1.OAuth2Provider(oauthConfig);
                return [4 /*yield*/, provider.exchangeCode(payload.code)];
            case 1:
                tokens = _b.sent();
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.save({
                        userId: req.user.id,
                        connectorId: connector.metadata.name,
                        connectorKind: connectorKind,
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        scope: tokens.scope,
                        tokenType: tokens.token_type,
                        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
                    })];
            case 2:
                _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ connected: true }))];
            case 3:
                error_4 = _b.sent();
                message = error_4 instanceof Error ? error_4.message : "OAuth callback failed";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/api-key", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, connectorKind, payload, error_5, message;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 2, , 3]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                if (connector.metadata.authType === "oauth2") {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Connector uses OAuth2").body)];
                }
                connectorKind = connector.metadata.category;
                payload = apiKeySchema.parse(req.body);
                if (!payload.apiKey && !payload.accessToken) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("apiKey or accessToken is required").body)];
                }
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.save({
                        userId: req.user.id,
                        connectorId: connector.metadata.name,
                        connectorKind: connectorKind,
                        apiKey: payload.apiKey,
                        apiSecret: (_b = (_a = payload.apiSecret) !== null && _a !== void 0 ? _a : payload.accessToken) !== null && _b !== void 0 ? _b : null,
                        accessToken: (_c = payload.accessToken) !== null && _c !== void 0 ? _c : null,
                        refreshToken: (_d = payload.refreshToken) !== null && _d !== void 0 ? _d : null,
                        accountId: (_e = payload.accountId) !== null && _e !== void 0 ? _e : null,
                        accountName: (_f = payload.accountName) !== null && _f !== void 0 ? _f : null,
                        metadata: (_g = payload.metadata) !== null && _g !== void 0 ? _g : null,
                    })];
            case 1:
                _h.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ connected: true }))];
            case 2:
                error_5 = _h.sent();
                message = error_5 instanceof Error ? error_5.message : "Failed to store API credentials";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/test", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, context, success, error_6, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.toContext(req.user.id, connector.metadata.name, (_a = req.body) === null || _a === void 0 ? void 0 : _a.accountId)];
            case 1:
                context = _b.sent();
                if (!context) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not authorised").body)];
                }
                return [4 /*yield*/, connector.testConnection(context)];
            case 2:
                success = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ success: success }))];
            case 3:
                error_6 = _b.sent();
                message = error_6 instanceof Error ? error_6.message : "Failed to test connector";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.delete("/:name/auth/:id", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_7, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.remove(req.params.id)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ removed: true }))];
            case 2:
                error_7 = _a.sent();
                message = error_7 instanceof Error ? error_7.message : "Failed to remove connector auth";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/actions/:actionId", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, payload, context, result, error_8, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                payload = actionRequestSchema.parse(req.body);
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.toContext(req.user.id, connector.metadata.name, payload.accountId)];
            case 1:
                context = _a.sent();
                if (!context) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not authorised").body)];
                }
                return [4 /*yield*/, ActionHandler_js_1.actionHandler.execute(connector.metadata.name, req.params.actionId, {
                        auth: context,
                        input: payload.input,
                    })];
            case 2:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 3:
                error_8 = _a.sent();
                message = error_8 instanceof Error ? error_8.message : "Failed to execute connector action";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.connectorsRouter.post("/:name/triggers/:triggerId/run", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connector, payload, context, triggerSettings, result, error_9, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                connector = index_js_1.connectorRegistry.get(req.params.name);
                if (!connector) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not found").body)];
                }
                payload = triggerRequestSchema.parse(req.body);
                return [4 /*yield*/, CredentialManager_js_1.connectorCredentialManager.toContext(req.user.id, connector.metadata.name, payload.accountId)];
            case 1:
                context = _b.sent();
                if (!context) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Connector not authorised").body)];
                }
                triggerSettings = normalizeRecord(payload.settings);
                return [4 /*yield*/, TriggerHandler_js_1.triggerHandler.run(connector.metadata.name, req.params.triggerId, {
                        auth: context,
                        cursor: (_a = payload.cursor) !== null && _a !== void 0 ? _a : null,
                        settings: triggerSettings !== null && triggerSettings !== void 0 ? triggerSettings : {},
                    })];
            case 2:
                result = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 3:
                error_9 = _b.sent();
                message = error_9 instanceof Error ? error_9.message : "Failed to run connector trigger";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.connectorsRouter;
