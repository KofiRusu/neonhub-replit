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
exports.connectorRegistry = void 0;
exports.registerConnectors = registerConnectors;
var ConnectorRegistry_js_1 = require("./base/ConnectorRegistry.js");
Object.defineProperty(exports, "connectorRegistry", { enumerable: true, get: function () { return ConnectorRegistry_js_1.connectorRegistry; } });
var SlackConnector_js_1 = require("./services/SlackConnector.js");
var GmailConnector_js_1 = require("./services/GmailConnector.js");
var GoogleSheetsConnector_js_1 = require("./services/GoogleSheetsConnector.js");
var TrelloConnector_js_1 = require("./services/TrelloConnector.js");
var StripeConnector_js_1 = require("./services/StripeConnector.js");
var NotionConnector_js_1 = require("./services/NotionConnector.js");
var AsanaConnector_js_1 = require("./services/AsanaConnector.js");
var HubSpotConnector_js_1 = require("./services/HubSpotConnector.js");
var TwitterConnector_js_1 = require("./services/TwitterConnector.js");
var DiscordConnector_js_1 = require("./services/DiscordConnector.js");
var GoogleSearchConsoleConnector_js_1 = require("./services/GoogleSearchConsoleConnector.js");
var SMSConnector_js_1 = require("./services/SMSConnector.js");
var WhatsAppConnector_js_1 = require("./services/WhatsAppConnector.js");
var RedditConnector_js_1 = require("./services/RedditConnector.js");
var InstagramConnector_js_1 = require("./services/InstagramConnector.js");
var FacebookConnector_js_1 = require("./services/FacebookConnector.js");
var YouTubeConnector_js_1 = require("./services/YouTubeConnector.js");
var TikTokConnector_js_1 = require("./services/TikTokConnector.js");
var GoogleAdsConnector_js_1 = require("./services/GoogleAdsConnector.js");
var ShopifyConnector_js_1 = require("./services/ShopifyConnector.js");
var LinkedInConnector_js_1 = require("./services/LinkedInConnector.js");
var connectors = [
    new SlackConnector_js_1.SlackConnector(),
    new GmailConnector_js_1.GmailConnector(),
    new GoogleSheetsConnector_js_1.GoogleSheetsConnector(),
    new TrelloConnector_js_1.TrelloConnector(),
    new StripeConnector_js_1.StripeConnector(),
    new NotionConnector_js_1.NotionConnector(),
    new AsanaConnector_js_1.AsanaConnector(),
    new HubSpotConnector_js_1.HubSpotConnector(),
    new TwitterConnector_js_1.TwitterConnector(),
    new DiscordConnector_js_1.DiscordConnector(),
    new GoogleSearchConsoleConnector_js_1.GoogleSearchConsoleConnector(),
    new SMSConnector_js_1.SMSConnector(),
    new WhatsAppConnector_js_1.WhatsAppConnector(),
    new RedditConnector_js_1.RedditConnector(),
    new InstagramConnector_js_1.InstagramConnector(),
    new FacebookConnector_js_1.FacebookConnector(),
    new YouTubeConnector_js_1.YouTubeConnector(),
    new TikTokConnector_js_1.TikTokConnector(),
    new GoogleAdsConnector_js_1.GoogleAdsConnector(),
    new ShopifyConnector_js_1.ShopifyConnector(),
    new LinkedInConnector_js_1.LinkedInConnector(),
];
function registerConnectors() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ConnectorRegistry_js_1.connectorRegistry.registerAll(connectors)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
