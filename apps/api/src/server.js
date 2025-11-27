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
var express_1 = require("express");
var http_1 = require("http");
var env_js_1 = require("./config/env.js");
var logger_js_1 = require("./lib/logger.js");
var index_js_1 = require("./ws/index.js");
var sentry_js_1 = require("./obs/sentry.js");
var auth_js_1 = require("./middleware/auth.js");
var securityHeaders_js_1 = require("./middleware/securityHeaders.js");
var cors_js_1 = require("./middleware/cors.js");
var rateLimit_js_1 = require("./middleware/rateLimit.js");
var adminGuard_js_1 = require("./middleware/adminGuard.js");
var auditLog_js_1 = require("./middleware/auditLog.js");
var health_js_1 = require("./routes/health.js");
var content_js_1 = require("./routes/content.js");
var metrics_js_1 = require("./routes/metrics.js");
var auth_js_2 = require("./routes/auth.js");
var jobs_js_1 = require("./routes/jobs.js");
var campaign_js_1 = require("./routes/campaign.js");
var marketing_js_1 = require("./routes/marketing.js");
var credentials_js_1 = require("./routes/credentials.js");
var settings_js_1 = require("./routes/settings.js");
var predictive_js_1 = require("./routes/predictive.js");
var governance_js_1 = require("./routes/governance.js");
var data_trust_js_1 = require("./routes/data-trust.js");
var eco_metrics_js_1 = require("./routes/eco-metrics.js");
var orchestration_js_1 = require("./routes/orchestration.js");
var stripe_webhook_js_1 = require("./routes/stripe-webhook.js");
var billing_js_1 = require("./routes/billing.js");
var documents_js_1 = require("./routes/documents.js");
var tasks_js_1 = require("./routes/tasks.js");
var feedback_js_1 = require("./routes/feedback.js");
var messages_js_1 = require("./routes/messages.js");
var team_js_1 = require("./routes/team.js");
var trends_js_1 = require("./routes/trends.js");
var personas_js_1 = require("./routes/personas.js");
var keywords_js_1 = require("./routes/keywords.js");
var editorial_calendar_js_1 = require("./routes/editorial-calendar.js");
var index_js_2 = require("./routes/seo/index.js");
var sdk_handshake_js_1 = require("./routes/sdk-handshake.js");
var orchestrate_js_1 = require("./routes/orchestrate.js");
var errors_js_1 = require("./lib/errors.js");
var index_js_3 = require("./connectors/index.js");
var connector_service_js_1 = require("./services/connector.service.js");
var connectors_js_1 = require("./routes/connectors.js");
var metrics_js_2 = require("./lib/metrics.js");
var cookie_parser_1 = require("cookie-parser");
var brand_voice_js_1 = require("./routes/brand-voice.js");
var person_js_1 = require("./routes/person.js");
var sms_js_1 = require("./routes/sms.js");
var social_js_1 = require("./routes/social.js");
var budget_js_1 = require("./routes/budget.js");
var sitemaps_js_1 = require("./routes/sitemaps.js");
var seo_analytics_job_js_1 = require("./jobs/seo-analytics.job.js");
var register_agents_js_1 = require("./services/orchestration/register-agents.js");
var index_js_4 = require("./queues/workers/index.js");
// Environment is validated on import
// Initialize Sentry (no-op if DSN not configured)
(0, sentry_js_1.initSentry)();
// Register connectors and sync metadata in background
(0, index_js_3.registerConnectors)()
    .then(connector_service_js_1.syncRegisteredConnectors)
    .catch(function (error) {
    logger_js_1.logger.error({ error: error }, "Failed to register connectors");
});
(0, seo_analytics_job_js_1.startSeoAnalyticsJob)();
// Start queue workers for email, SMS, and social channels
(0, index_js_4.startAllWorkers)().catch(function (error) {
    logger_js_1.logger.error({ error: error }, "Failed to start queue workers");
});
(0, register_agents_js_1.registerDefaultAgents)();
// Create Express app
var app = (0, express_1.default)();
var httpServer = (0, http_1.createServer)(app);
// Initialize WebSocket
(0, index_js_1.initWebSocket)(httpServer);
// Stripe webhook must receive raw body before any JSON middleware
app.use("/api/billing/webhook", stripe_webhook_js_1.stripeWebhookRouter);
// Security Middleware Stack (Week 3)
// 1. Body parsing with size limits (1MB) for all non-webhook routes
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// 2. Cookie parsing for session auth
app.use((0, cookie_parser_1.default)(env_js_1.env.NEXTAUTH_SECRET));
// 3. Security headers (global)
app.use(securityHeaders_js_1.securityHeaders);
// 4. Strict CORS
app.use(cors_js_1.strictCORS);
// 5. Rate limiting (global, with feature flag support)
app.use(rateLimit_js_1.rateLimit);
// Request logging with metrics
app.use(function (req, res, next) {
    var startTime = Date.now();
    logger_js_1.logger.info({ method: req.method, url: req.url }, "Request received");
    // Record metrics when response finishes
    res.on("finish", function () {
        var _a;
        var duration = (Date.now() - startTime) / 1000; // Convert to seconds
        var route = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.url;
        (0, metrics_js_2.recordHttpRequest)(req.method, route, res.statusCode, duration);
    });
    next();
});
// Public routes (no auth required)
app.use(health_js_1.healthRouter);
app.use(rateLimit_js_1.authRateLimit, auth_js_2.authRouter); // Stricter rate limit on auth endpoints
app.use(sdk_handshake_js_1.sdkHandshakeRouter);
app.use("/api", sitemaps_js_1.sitemapsRouter);
// Prometheus metrics endpoint (public, typically accessed by Prometheus scraper)
app.get("/metrics", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                res.set("Content-Type", "text/plain; version=0.0.4");
                return [4 /*yield*/, (0, metrics_js_2.getMetrics)()];
            case 1:
                metrics = _a.sent();
                res.send(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_js_1.logger.error({ error: error_1 }, "Failed to generate metrics");
                res.status(500).send("Error generating metrics");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Protected routes (auth required + audit logging)
app.use("/api", auth_js_1.requireAuth, orchestrate_js_1.orchestrateRouter);
app.use(auth_js_1.requireAuth, content_js_1.contentRouter);
app.use(auth_js_1.requireAuth, metrics_js_1.metricsRouter);
app.use(auth_js_1.requireAuth, jobs_js_1.jobsRouter);
app.use('/api/campaigns', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('campaign'), campaign_js_1.campaignRouter);
app.use('/api/marketing', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('marketing'), marketing_js_1.marketingRouter);
app.use('/api/credentials', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('credential'), credentials_js_1.default);
app.use('/api/settings', auth_js_1.requireAuth, adminGuard_js_1.adminIPGuard, (0, auditLog_js_1.auditMiddleware)('settings'), settings_js_1.default);
app.use('/api/predictive', auth_js_1.requireAuth, predictive_js_1.default);
app.use('/api/governance', auth_js_1.requireAuth, adminGuard_js_1.adminIPGuard, (0, auditLog_js_1.auditMiddleware)('governance'), governance_js_1.default);
app.use('/api/data-trust', auth_js_1.requireAuth, adminGuard_js_1.adminIPGuard, (0, auditLog_js_1.auditMiddleware)('data-trust'), data_trust_js_1.default);
app.use('/api/eco-metrics', auth_js_1.requireAuth, adminGuard_js_1.adminIPGuard, (0, auditLog_js_1.auditMiddleware)('eco-metrics'), eco_metrics_js_1.default);
app.use('/api/orchestration', auth_js_1.requireAuth, adminGuard_js_1.adminIPGuard, (0, auditLog_js_1.auditMiddleware)('orchestration'), orchestration_js_1.default);
app.use('/api', auth_js_1.requireAuth, billing_js_1.default); // Billing routes with auth
// Phase 4 Beta routes
app.use('/api/documents', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('document'), documents_js_1.default);
app.use('/api/tasks', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('task'), tasks_js_1.default);
app.use('/api/feedback', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('feedback'), feedback_js_1.default);
app.use('/api/messages', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('message'), messages_js_1.default);
app.use('/api/team', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('team'), team_js_1.teamRouter);
app.use('/api/trends', auth_js_1.requireAuth, trends_js_1.trendsRouter);
app.use('/api/connectors', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('connector'), connectors_js_1.default);
app.use('/api/personas', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('persona'), personas_js_1.default);
app.use('/api/keywords', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('keyword'), keywords_js_1.default);
app.use('/api/editorial-calendar', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('editorial-calendar'), editorial_calendar_js_1.default);
app.use('/api/seo', auth_js_1.requireAuth, (0, auditLog_js_1.auditMiddleware)('seo'), index_js_2.default);
app.use('/api/brand-voice', auth_js_1.requireAuth, brand_voice_js_1.default);
app.use('/api/person', auth_js_1.requireAuth, person_js_1.default);
app.use('/api/budget', auth_js_1.requireAuth, budget_js_1.default);
app.use('/api/sms', sms_js_1.default);
app.use('/api/social', social_js_1.default);
// 404 handler
app.use(function (_req, res) {
    res.status(404).json({ error: "Not found" });
});
// Error handler
app.use(function (err, _req, res, _next) {
    // Capture error in Sentry
    if (!(err instanceof errors_js_1.AppError) || err.statusCode >= 500) {
        sentry_js_1.Sentry.captureException(err);
    }
    if (err instanceof errors_js_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
        });
    }
    logger_js_1.logger.error({ err: err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
});
// Start server
var port = env_js_1.env.PORT;
httpServer.listen(port, "0.0.0.0", function () {
    logger_js_1.logger.info({ port: port, env: env_js_1.env.NODE_ENV }, "🚀 NeonHub API server started");
});
// Graceful shutdown
var shutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_js_1.logger.info({ signal: signal }, "Received shutdown signal, closing gracefully...");
                // Stop accepting new connections
                httpServer.close(function () {
                    logger_js_1.logger.info("HTTP server closed");
                });
                // Stop queue workers
                return [4 /*yield*/, (0, index_js_4.stopAllWorkers)()];
            case 1:
                // Stop queue workers
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };
process.on("SIGTERM", function () { return shutdown("SIGTERM"); });
process.on("SIGINT", function () { return shutdown("SIGINT"); });
exports.default = app;
