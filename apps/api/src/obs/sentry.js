"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = void 0;
exports.initSentry = initSentry;
var Sentry = require("@sentry/node");
exports.Sentry = Sentry;
var profiling_node_1 = require("@sentry/profiling-node");
var env_js_1 = require("../config/env.js");
var logger_js_1 = require("../lib/logger.js");
function initSentry() {
    var env = (0, env_js_1.getEnv)();
    if (!env.SENTRY_DSN) {
        logger_js_1.logger.info("Sentry DSN not configured - error tracking disabled");
        return;
    }
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        integrations: [
            (0, profiling_node_1.nodeProfilingIntegration)(),
        ],
        tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
        profilesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    });
    logger_js_1.logger.info("✅ Sentry initialized");
}
