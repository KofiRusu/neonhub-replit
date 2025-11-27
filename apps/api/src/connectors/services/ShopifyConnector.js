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
exports.ShopifyConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var API_VERSION = "2023-10";
var credentialsSchema = zod_1.z.object({
    shopDomain: zod_1.z.string().min(1, "Shopify shop domain is required"),
    accessToken: zod_1.z.string().min(1, "Admin API access token is required"),
});
var createProductInput = zod_1.z.object({
    shopDomain: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, "Product title is required"),
    bodyHtml: zod_1.z.string().optional(),
    vendor: zod_1.z.string().optional(),
    productType: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    variants: zod_1.z
        .array(zod_1.z.object({
        price: zod_1.z.string().optional(),
        sku: zod_1.z.string().optional(),
        inventoryQuantity: zod_1.z.number().int().optional(),
    }))
        .default([]),
});
var createOrderInput = zod_1.z.object({
    shopDomain: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    lineItems: zod_1.z
        .array(zod_1.z.object({
        variantId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1),
    note: zod_1.z.string().optional(),
});
var listOrdersInput = zod_1.z.object({
    shopDomain: zod_1.z.string().optional(),
    status: zod_1.z.enum(["open", "closed", "cancelled", "any"]).default("any"),
    limit: zod_1.z.number().int().min(1).max(250).default(20),
});
function resolveCredentials(auth, overrideDomain) {
    var _a, _b;
    var shopDomain = overrideDomain !== null && overrideDomain !== void 0 ? overrideDomain : (_a = auth.metadata) === null || _a === void 0 ? void 0 : _a.shopDomain;
    var accessToken = (_b = auth.accessToken) !== null && _b !== void 0 ? _b : auth.apiKey;
    var parsed = credentialsSchema.parse({ shopDomain: shopDomain, accessToken: accessToken });
    return {
        shopDomain: parsed.shopDomain,
        accessToken: parsed.accessToken,
    };
}
function buildUrl(creds, path, query) {
    var url = new URL("https://".concat(creds.shopDomain, "/admin/api/").concat(API_VERSION, "/").concat(path));
    if (query) {
        url.search = query.toString();
    }
    return url.toString();
}
function shopifyRequest(creds_1, path_1) {
    return __awaiter(this, arguments, void 0, function (creds, path, init, query) {
        var response;
        var _a;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(creds, path, query), __assign(__assign({}, init), { headers: __assign({ "Content-Type": "application/json", "X-Shopify-Access-Token": creds.accessToken }, ((_a = init.headers) !== null && _a !== void 0 ? _a : {})) }))];
                case 1:
                    response = _b.sent();
                    if (!response.ok) {
                        throw new Error("Shopify API error ".concat(response.status));
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
var ShopifyConnector = /** @class */ (function (_super) {
    __extends(ShopifyConnector, _super);
    function ShopifyConnector() {
        var _this = _super.call(this, {
            name: "shopify",
            displayName: "Shopify",
            description: "Create products, manage orders, and fetch commerce data from Shopify.",
            category: "SHOPIFY",
            iconUrl: "https://cdn.shopify.com/shopifycloud/web/assets/v1/favicon.ico",
            websiteUrl: "https://www.shopify.com",
            authType: "api_key",
            authConfig: {
                instructions: "Provide the Admin API access token as API key. Set the shop domain in metadata.shopDomain or per request.",
            },
        }) || this;
        _this.actions = [
            {
                id: "createProduct",
                name: "Create Product",
                description: "Create a product with optional variants.",
                inputSchema: createProductInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createProductInput.parse(input);
                                creds = resolveCredentials(auth, payload.shopDomain);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return shopifyRequest(creds, "products.json", {
                                            method: "POST",
                                            body: JSON.stringify({
                                                product: {
                                                    title: payload.title,
                                                    body_html: payload.bodyHtml,
                                                    vendor: payload.vendor,
                                                    product_type: payload.productType,
                                                    tags: payload.tags.join(","),
                                                    variants: payload.variants.map(function (variant) { return ({
                                                        price: variant.price,
                                                        sku: variant.sku,
                                                        inventory_quantity: variant.inventoryQuantity,
                                                    }); }),
                                                },
                                            }),
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, {
                                        productId: result.product.id,
                                        handle: result.product.handle,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "createOrder",
                name: "Create Order",
                description: "Create an order for existing variants.",
                inputSchema: createOrderInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createOrderInput.parse(input);
                                creds = resolveCredentials(auth, payload.shopDomain);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return shopifyRequest(creds, "orders.json", {
                                            method: "POST",
                                            body: JSON.stringify({
                                                order: {
                                                    email: payload.email,
                                                    note: payload.note,
                                                    line_items: payload.lineItems.map(function (item) { return ({
                                                        variant_id: item.variantId,
                                                        quantity: item.quantity,
                                                    }); }),
                                                },
                                            }),
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, {
                                        orderId: result.order.id,
                                        name: result.order.name,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "listOrders",
                name: "List Orders",
                description: "List recent orders with status filtering.",
                inputSchema: listOrdersInput,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, params, result;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = listOrdersInput.parse(input);
                                creds = resolveCredentials(auth, payload.shopDomain);
                                params = new URLSearchParams();
                                params.set("status", payload.status);
                                params.set("limit", String(payload.limit));
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return shopifyRequest(creds, "orders.json", { method: "GET" }, params);
                                    })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, (_c = result.orders) !== null && _c !== void 0 ? _c : []];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    ShopifyConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = resolveCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return shopifyRequest(creds_1, "shop.json", { method: "GET" }); })];
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
    return ShopifyConnector;
}(Connector_js_1.Connector));
exports.ShopifyConnector = ShopifyConnector;
