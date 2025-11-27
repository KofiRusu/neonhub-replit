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
exports.teamRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var uuid_1 = require("uuid");
var http_1 = require("../lib/http");
var errors_1 = require("../lib/errors");
var invite_js_1 = require("../services/team/invite.js");
var logger_js_1 = require("../lib/logger.js");
var teamService = require("../services/team.service.js");
exports.teamRouter = (0, express_1.Router)();
// In-memory token store (TODO: replace with database)
var inviteTokens = new Map();
// Validation schemas
var InviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    role: zod_1.z.enum(["Admin", "Member", "Guest"]),
    message: zod_1.z.string().optional(),
});
// GET /team/members - List all team members
exports.teamRouter.get("/team/members", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, role, status_1, filters, members, e_1, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, role = _a.role, status_1 = _a.status;
                filters = {};
                if (role && typeof role === 'string') {
                    filters.role = role;
                }
                if (status_1 && typeof status_1 === 'string') {
                    filters.status = status_1;
                }
                return [4 /*yield*/, teamService.getTeamMembers(filters)];
            case 1:
                members = _b.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(members))];
            case 2:
                e_1 = _b.sent();
                message = e_1 instanceof Error ? e_1.message : "Server error";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /team/stats - Get team statistics
exports.teamRouter.get("/team/stats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats, e_2, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, teamService.getTeamStats()];
            case 1:
                stats = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(stats))];
            case 2:
                e_2 = _a.sent();
                message = e_2 instanceof Error ? e_2.message : "Server error";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /team/members/:id - Get specific team member
exports.teamRouter.get("/team/members/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var member, e_3, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, teamService.getTeamMemberById(req.params.id)];
            case 1:
                member = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(member))];
            case 2:
                e_3 = _a.sent();
                message = e_3 instanceof Error ? e_3.message : "Server error";
                status_2 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /team/members/:id - Update team member
exports.teamRouter.put("/team/members/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, role, department, status_3, member, e_4, message, status_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, role = _a.role, department = _a.department, status_3 = _a.status;
                return [4 /*yield*/, teamService.updateTeamMember(req.params.id, {
                        role: role,
                        department: department,
                        status: status_3,
                    })];
            case 1:
                member = _b.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(member))];
            case 2:
                e_4 = _b.sent();
                message = e_4 instanceof Error ? e_4.message : "Server error";
                status_4 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_4).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /team/members/:id - Remove team member
exports.teamRouter.delete("/team/members/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, e_5, message, status_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, teamService.removeTeamMember(req.params.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_1.ok)(result))];
            case 2:
                e_5 = _a.sent();
                message = e_5 instanceof Error ? e_5.message : "Server error";
                status_5 = message.includes('not found') || message.includes('Cannot remove') ? 404 : 500;
                return [2 /*return*/, res.status(status_5).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /team/invitations - Get pending invitations
exports.teamRouter.get("/team/invitations", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var invitations, message;
    return __generator(this, function (_a) {
        try {
            invitations = Array.from(inviteTokens.entries())
                .filter(function (_a) {
                var _ = _a[0], invite = _a[1];
                return !invite.used && invite.expiresAt > new Date();
            })
                .map(function (_a) {
                var token = _a[0], invite = _a[1];
                return ({
                    id: token,
                    email: invite.email,
                    role: invite.role,
                    invitedBy: "Current User", // TODO: Track who sent invite
                    sentAt: invite.createdAt.toISOString().split('T')[0],
                    expiresAt: invite.expiresAt.toISOString().split('T')[0],
                });
            });
            return [2 /*return*/, res.json((0, http_1.ok)(invitations))];
        }
        catch (e) {
            message = e instanceof Error ? e.message : "Server error";
            return [2 /*return*/, res.status(500).json((0, http_1.fail)(message))];
        }
        return [2 /*return*/];
    });
}); });
// POST /team/invite
exports.teamRouter.post("/team/invite", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, _a, email, role, token, now, expiresAt, emailResult, newInvitation, e_6, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                result = InviteMemberSchema.safeParse(req.body);
                if (!result.success) {
                    throw new errors_1.ValidationError(result.error.errors[0].message);
                }
                _a = result.data, email = _a.email, role = _a.role;
                token = (0, uuid_1.v4)();
                now = new Date();
                expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                // Store token (TODO: persist in database)
                inviteTokens.set(token, {
                    email: email,
                    role: role,
                    createdAt: now,
                    expiresAt: expiresAt,
                    used: false,
                });
                return [4 /*yield*/, (0, invite_js_1.sendInviteEmail)({
                        to: email,
                        token: token,
                        role: role,
                        fromName: "NeonHub Team", // TODO: Get from authenticated user
                        redirectUrl: process.env.INVITE_REDIRECT_URL || process.env.APP_BASE_URL,
                    })];
            case 1:
                emailResult = _b.sent();
                logger_js_1.logger.info({ email: email, role: role, token: token, emailConfigured: (0, invite_js_1.isEmailServiceConfigured)() }, "Team invitation created");
                newInvitation = {
                    id: "inv_".concat(Date.now()),
                    email: email,
                    role: role,
                    invitedBy: "Current User", // TODO: Get from authenticated user
                    sentAt: now.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    emailSent: emailResult.success,
                    previewUrl: emailResult.previewUrl, // Only in mock mode
                };
                return [2 /*return*/, res.json((0, http_1.ok)(newInvitation))];
            case 2:
                e_6 = _b.sent();
                if (e_6 instanceof errors_1.ValidationError) {
                    return [2 /*return*/, res.status(400).json((0, http_1.fail)(e_6.message).body)];
                }
                message = e_6 instanceof Error ? e_6.message : "Server error";
                return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /team/members/:id
exports.teamRouter.delete("/team/members/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, message;
    return __generator(this, function (_a) {
        try {
            id = req.params.id;
            if (!id) {
                throw new errors_1.ValidationError("Member ID is required");
            }
            // TODO: 
            // 1. Check permissions (only Owner/Admin can remove)
            // 2. Delete member from database
            // 3. Revoke access
            // 4. Send notification
            return [2 /*return*/, res.json((0, http_1.ok)({ success: true, memberId: id }))];
        }
        catch (e) {
            if (e instanceof errors_1.ValidationError) {
                return [2 /*return*/, res.status(400).json((0, http_1.fail)(e.message).body)];
            }
            message = e instanceof Error ? e.message : "Server error";
            return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
        }
        return [2 /*return*/];
    });
}); });
// DELETE /team/invitations/:id
exports.teamRouter.delete("/team/invitations/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, message;
    return __generator(this, function (_a) {
        try {
            id = req.params.id;
            if (!id) {
                throw new errors_1.ValidationError("Invitation ID is required");
            }
            // TODO: Delete invitation from database
            return [2 /*return*/, res.json((0, http_1.ok)({ success: true, invitationId: id }))];
        }
        catch (e) {
            if (e instanceof errors_1.ValidationError) {
                return [2 /*return*/, res.status(400).json((0, http_1.fail)(e.message).body)];
            }
            message = e instanceof Error ? e.message : "Server error";
            return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
        }
        return [2 /*return*/];
    });
}); });
// GET /team/accept?token=xxx
exports.teamRouter.get("/team/accept", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, invite, redirectUrl, message;
    return __generator(this, function (_a) {
        try {
            token = req.query.token;
            if (!token || typeof token !== "string") {
                throw new errors_1.ValidationError("Invalid or missing token");
            }
            invite = inviteTokens.get(token);
            if (!invite) {
                return [2 /*return*/, res.status(404).send("\n        <html>\n          <body style=\"font-family: sans-serif; text-align: center; padding: 50px;\">\n            <h1>\u274C Invalid Invitation</h1>\n            <p>This invitation link is invalid or has expired.</p>\n          </body>\n        </html>\n      ")];
            }
            // Check if already used
            if (invite.used) {
                return [2 /*return*/, res.status(400).send("\n        <html>\n          <body style=\"font-family: sans-serif; text-align: center; padding: 50px;\">\n            <h1>\u26A0\uFE0F Invitation Already Used</h1>\n            <p>This invitation has already been accepted.</p>\n          </body>\n        </html>\n      ")];
            }
            // Check if expired
            if (invite.expiresAt < new Date()) {
                return [2 /*return*/, res.status(400).send("\n        <html>\n          <body style=\"font-family: sans-serif; text-align: center; padding: 50px;\">\n            <h1>\u23F0 Invitation Expired</h1>\n            <p>This invitation has expired. Please request a new one.</p>\n          </body>\n        </html>\n      ")];
            }
            // Mark as used
            invite.used = true;
            inviteTokens.set(token, invite);
            logger_js_1.logger.info({ email: invite.email, role: invite.role, token: token }, "Invitation accepted");
            redirectUrl = process.env.INVITE_REDIRECT_URL || process.env.APP_BASE_URL || "http://127.0.0.1:3000";
            res.send("\n      <html>\n        <head>\n          <meta http-equiv=\"refresh\" content=\"2; url=".concat(redirectUrl, "\">\n        </head>\n        <body style=\"font-family: sans-serif; text-align: center; padding: 50px;\">\n          <h1>\u2705 Invitation Accepted!</h1>\n          <p>Welcome to the team! Redirecting you to sign in...</p>\n          <p style=\"color: #666; font-size: 14px;\">If not redirected, <a href=\"").concat(redirectUrl, "\">click here</a>.</p>\n        </body>\n      </html>\n    "));
        }
        catch (e) {
            if (e instanceof errors_1.ValidationError) {
                return [2 /*return*/, res.status(400).json((0, http_1.fail)(e.message).body)];
            }
            message = e instanceof Error ? e.message : "Server error";
            return [2 /*return*/, res.status(500).json((0, http_1.fail)(message).body)];
        }
        return [2 /*return*/];
    });
}); });
exports.default = exports.teamRouter;
