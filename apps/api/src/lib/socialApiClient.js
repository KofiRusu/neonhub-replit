"use strict";
/**
 * Social API Client for TrendAgent
 * Fetches trending data from Twitter/Reddit APIs
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialApiClient = exports.SocialApiClient = void 0;
var node_buffer_1 = require("node:buffer");
var SocialApiClient = /** @class */ (function () {
    function SocialApiClient() {
        this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN || '';
        this.redditClientId = process.env.REDDIT_CLIENT_ID || '';
        this.redditClientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    }
    /**
     * Fetch trending topics from Twitter
     */
    SocialApiClient.prototype.fetchTwitterTrends = function () {
        return __awaiter(this, arguments, void 0, function (_location) {
            var url, response, text, payload, error_1;
            if (_location === void 0) { _location = 'worldwide'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // In development, return mock data if no API key
                        if (!this.twitterBearerToken || process.env.NODE_ENV === 'development') {
                            return [2 /*return*/, this.getMockTwitterData()];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        url = new URL('https://api.twitter.com/2/tweets/search/recent');
                        url.searchParams.set('query', 'trending -is:retweet');
                        url.searchParams.set('max_results', '50');
                        url.searchParams.set('tweet.fields', 'public_metrics,created_at');
                        return [4 /*yield*/, fetch(url.toString(), {
                                headers: {
                                    Authorization: "Bearer ".concat(this.twitterBearerToken),
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        text = _a.sent();
                        console.error('Twitter API error:', response.status, text);
                        return [2 /*return*/, this.getMockTwitterData()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        payload = _a.sent();
                        if (!payload.data)
                            return [2 /*return*/, this.getMockTwitterData()];
                        return [2 /*return*/, payload.data.map(function (tweet) { return ({
                                keyword: tweet.text.split(' ').slice(0, 3).join(' '),
                                volume: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count,
                                sentiment: 0.5,
                                platform: 'twitter',
                                timestamp: new Date(tweet.created_at),
                            }); })];
                    case 6:
                        error_1 = _a.sent();
                        console.error('Twitter API error:', error_1);
                        return [2 /*return*/, this.getMockTwitterData()];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch trending topics from Reddit
     */
    SocialApiClient.prototype.fetchRedditTrends = function () {
        return __awaiter(this, arguments, void 0, function (subreddit) {
            var auth, tokenResponse, text, tokenPayload, accessToken, url, response, text, payload, error_2;
            if (subreddit === void 0) { subreddit = 'all'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // In development, return mock data if no API key
                        if (!this.redditClientId || process.env.NODE_ENV === 'development') {
                            return [2 /*return*/, this.getMockRedditData()];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        auth = node_buffer_1.Buffer.from("".concat(this.redditClientId, ":").concat(this.redditClientSecret)).toString('base64');
                        return [4 /*yield*/, fetch('https://www.reddit.com/api/v1/access_token', {
                                method: 'POST',
                                headers: {
                                    Authorization: "Basic ".concat(auth),
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: 'grant_type=client_credentials',
                            })];
                    case 2:
                        tokenResponse = _a.sent();
                        if (!!tokenResponse.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, tokenResponse.text()];
                    case 3:
                        text = _a.sent();
                        console.error('Reddit token error:', text);
                        return [2 /*return*/, this.getMockRedditData()];
                    case 4: return [4 /*yield*/, tokenResponse.json()];
                    case 5:
                        tokenPayload = _a.sent();
                        accessToken = tokenPayload.access_token;
                        url = new URL("https://oauth.reddit.com/r/".concat(subreddit, "/hot"));
                        url.searchParams.set('limit', '50');
                        return [4 /*yield*/, fetch(url.toString(), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    'User-Agent': process.env.REDDIT_USER_AGENT || 'NeonHub/3.0',
                                },
                            })];
                    case 6:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 8];
                        return [4 /*yield*/, response.text()];
                    case 7:
                        text = _a.sent();
                        console.error('Reddit API error:', text);
                        return [2 /*return*/, this.getMockRedditData()];
                    case 8: return [4 /*yield*/, response.json()];
                    case 9:
                        payload = _a.sent();
                        return [2 /*return*/, payload.data.children.map(function (post) { return ({
                                keyword: post.data.title,
                                volume: post.data.ups + post.data.num_comments,
                                sentiment: post.data.upvote_ratio,
                                platform: 'reddit',
                                timestamp: new Date(post.data.created_utc * 1000),
                            }); })];
                    case 10:
                        error_2 = _a.sent();
                        console.error('Reddit API error:', error_2);
                        return [2 /*return*/, this.getMockRedditData()];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aggregate trends from all platforms
     */
    SocialApiClient.prototype.aggregateTrends = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, twitter, reddit;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.fetchTwitterTrends(),
                            this.fetchRedditTrends(),
                        ])];
                    case 1:
                        _a = _b.sent(), twitter = _a[0], reddit = _a[1];
                        return [2 /*return*/, __spreadArray(__spreadArray([], twitter, true), reddit, true).sort(function (a, b) { return b.volume - a.volume; })];
                }
            });
        });
    };
    // Mock data for development
    SocialApiClient.prototype.getMockTwitterData = function () {
        return [
            { keyword: 'AI Revolution', volume: 15000, sentiment: 0.8, platform: 'twitter', timestamp: new Date() },
            { keyword: 'Tech Startups', volume: 12000, sentiment: 0.7, platform: 'twitter', timestamp: new Date() },
            { keyword: 'Marketing Trends', volume: 9000, sentiment: 0.6, platform: 'twitter', timestamp: new Date() },
        ];
    };
    SocialApiClient.prototype.getMockRedditData = function () {
        return [
            { keyword: 'SaaS Growth Hacks', volume: 8000, sentiment: 0.75, platform: 'reddit', timestamp: new Date() },
            { keyword: 'Content Marketing', volume: 6500, sentiment: 0.65, platform: 'reddit', timestamp: new Date() },
            { keyword: 'B2B Sales Tips', volume: 5500, sentiment: 0.70, platform: 'reddit', timestamp: new Date() },
        ];
    };
    return SocialApiClient;
}());
exports.SocialApiClient = SocialApiClient;
exports.socialApiClient = new SocialApiClient();
