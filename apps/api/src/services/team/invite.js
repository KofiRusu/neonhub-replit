"use strict";
/**
 * Team Invitation Service
 * Handles email invitations via Resend (or fallback to mock)
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = sendInviteEmail;
exports.isEmailServiceConfigured = isEmailServiceConfigured;
var resend_1 = require("resend");
var logger_js_1 = require("../../lib/logger.js");
// Initialize Resend (only if API key present)
var resendKey = process.env.RESEND_API_KEY;
var isEmailConfigured = !!resendKey;
var resend = null;
if (isEmailConfigured) {
    resend = new resend_1.Resend(resendKey);
    logger_js_1.logger.info("Resend email service initialized");
}
else {
    logger_js_1.logger.warn("RESEND_API_KEY not found - email invites will use mock mode");
}
/**
 * Send team invitation email
 */
function sendInviteEmail(params) {
    return __awaiter(this, void 0, void 0, function () {
        var to, token, role, _a, fromName, baseUrl, acceptUrl, result, error_1;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    to = params.to, token = params.token, role = params.role, _a = params.fromName, fromName = _a === void 0 ? "NeonHub Team" : _a;
                    baseUrl = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
                    acceptUrl = "".concat(baseUrl, "/team/accept?token=").concat(token);
                    if (!(resend && isEmailConfigured)) return [3 /*break*/, 5];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resend.emails.send({
                            from: "NeonHub <invites@neonhub.ai>", // TODO: Configure verified domain
                            to: to,
                            subject: "You've been invited to join ".concat(fromName, "'s team on NeonHub"),
                            html: generateInviteEmail({
                                role: role,
                                fromName: fromName,
                                acceptUrl: acceptUrl,
                                expiresIn: "7 days",
                            }),
                        })];
                case 2:
                    result = _d.sent();
                    logger_js_1.logger.info({ to: to, messageId: (_b = result.data) === null || _b === void 0 ? void 0 : _b.id, token: token }, "Invitation email sent");
                    return [2 /*return*/, {
                            success: true,
                            messageId: (_c = result.data) === null || _c === void 0 ? void 0 : _c.id,
                        }];
                case 3:
                    error_1 = _d.sent();
                    logger_js_1.logger.error({ error: error_1, to: to }, "Failed to send invitation email");
                    throw new Error("Failed to send invitation email");
                case 4: return [3 /*break*/, 6];
                case 5:
                    // Mock mode: log and return preview link
                    logger_js_1.logger.info({ to: to, token: token, acceptUrl: acceptUrl }, "Mock invitation email (RESEND_API_KEY not configured)");
                    return [2 /*return*/, {
                            success: true,
                            previewUrl: acceptUrl,
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate HTML email template
 */
function generateInviteEmail(params) {
    var role = params.role, fromName = params.fromName, acceptUrl = params.acceptUrl, expiresIn = params.expiresIn;
    return "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Team Invitation</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;\">\n  <div style=\"background: linear-gradient(135deg, #00D9FF 0%, #B14BFF 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;\">\n    <h1 style=\"color: white; margin: 0; font-size: 28px;\">NeonHub</h1>\n    <p style=\"color: rgba(255,255,255,0.9); margin: 10px 0 0 0;\">AI-Powered Marketing Platform</p>\n  </div>\n  \n  <div style=\"background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;\">\n    <h2 style=\"color: #0E0F1A; margin-top: 0;\">You've Been Invited! \uD83C\uDF89</h2>\n    \n    <p>Hi there,</p>\n    \n    <p><strong>".concat(fromName, "</strong> has invited you to join their team on NeonHub as a <strong>").concat(role, "</strong>.</p>\n    \n    <p>NeonHub is an advanced AI-powered marketing automation platform that helps teams create content, analyze trends, and collaborate effectively.</p>\n    \n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"").concat(acceptUrl, "\" style=\"display: inline-block; background: linear-gradient(135deg, #00D9FF 0%, #B14BFF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;\">Accept Invitation \u2192</a>\n    </div>\n    \n    <p style=\"font-size: 14px; color: #666;\">\n      This invitation expires in <strong>").concat(expiresIn, "</strong>. If you didn't expect this invitation, you can safely ignore this email.\n    </p>\n    \n    <hr style=\"border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;\">\n    \n    <p style=\"font-size: 12px; color: #999; text-align: center;\">\n      NeonHub - AI Marketing Platform<br>\n      <a href=\"https://neonhubecosystem.com\" style=\"color: #00D9FF;\">neonhubecosystem.com</a>\n    </p>\n  </div>\n</body>\n</html>\n  ").trim();
}
/**
 * Check if email service is configured
 */
function isEmailServiceConfigured() {
    return isEmailConfigured;
}
