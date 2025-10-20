"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const env_js_1 = require("../config/env.js");
const env = (0, env_js_1.getEnv)();
exports.logger = (0, pino_1.default)({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport: env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
            },
        }
        : undefined,
});
//# sourceMappingURL=logger.js.map