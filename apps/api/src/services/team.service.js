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
exports.getTeamMembers = getTeamMembers;
exports.getTeamMemberById = getTeamMemberById;
exports.createTeamMember = createTeamMember;
exports.updateTeamMember = updateTeamMember;
exports.removeTeamMember = removeTeamMember;
exports.getTeamStats = getTeamStats;
var client_1 = require("@prisma/client");
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
function resolveOrganizationId(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var membership;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.organizationMembership.findFirst({
                        where: { userId: userId },
                        select: { organizationId: true },
                    })];
                case 1:
                    membership = _b.sent();
                    return [2 /*return*/, (_a = membership === null || membership === void 0 ? void 0 : membership.organizationId) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
var toMetadataObject = function (value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return __assign({}, value);
};
var stripUndefined = function (record) {
    return Object.fromEntries(Object.entries(record).filter(function (_a) {
        var value = _a[1];
        return value !== undefined;
    }));
};
var prepareMetadata = function (input) {
    if (!input) {
        return undefined;
    }
    var cleaned = stripUndefined(input);
    return Object.keys(cleaned).length ? cleaned : undefined;
};
var mergeMetadata = function (current, updates) {
    if (!updates || Object.keys(updates).length === 0) {
        return current !== null && current !== void 0 ? current : undefined;
    }
    var base = toMetadataObject(current);
    for (var _i = 0, _a = Object.entries(updates); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value === undefined) {
            delete base[key];
        }
        else {
            base[key] = value;
        }
    }
    return Object.keys(base).length ? base : undefined;
};
function getTeamMembers(filters) {
    return __awaiter(this, void 0, void 0, function () {
        var where, members, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    where = {};
                    if (filters === null || filters === void 0 ? void 0 : filters.role) {
                        where.role = filters.role;
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.status) {
                        where.status = filters.status;
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.findMany({
                            where: where,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                            orderBy: [
                                { role: 'asc' },
                                { joinedAt: 'desc' },
                            ],
                        })];
                case 1:
                    members = _a.sent();
                    // Transform to match expected format
                    return [2 /*return*/, members.map(function (member) {
                            var _a;
                            return ({
                                id: member.id,
                                userId: member.userId,
                                name: member.user.name || 'Unknown',
                                email: member.user.email,
                                avatar: member.user.image || '/placeholder-user.jpg',
                                role: member.role,
                                department: member.department || 'General',
                                status: member.status,
                                joinedAt: member.joinedAt.toISOString().split('T')[0],
                                metadata: toMetadataObject((_a = member.metadata) !== null && _a !== void 0 ? _a : null),
                            });
                        })];
                case 2:
                    error_1 = _a.sent();
                    logger_js_1.logger.error({ error: error_1 }, 'Failed to fetch team members');
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getTeamMemberById(memberId) {
    return __awaiter(this, void 0, void 0, function () {
        var member, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.findUnique({
                            where: { id: memberId },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    member = _a.sent();
                    if (!member) {
                        throw new Error('Team member not found');
                    }
                    return [2 /*return*/, {
                            id: member.id,
                            userId: member.userId,
                            name: member.user.name || 'Unknown',
                            email: member.user.email,
                            avatar: member.user.image || '/placeholder-user.jpg',
                            role: member.role,
                            department: member.department || 'General',
                            status: member.status,
                            joinedAt: member.joinedAt,
                            invitedAt: member.invitedAt,
                            invitedBy: member.invitedBy,
                            metadata: toMetadataObject(member.metadata),
                        }];
                case 2:
                    error_2 = _a.sent();
                    logger_js_1.logger.error({ error: error_2, memberId: memberId }, 'Failed to fetch team member');
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createTeamMember(input) {
    return __awaiter(this, void 0, void 0, function () {
        var user, organizationId, _a, _b, existing, metadata, member, error_3;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, prisma_js_1.prisma.user.findUnique({
                            where: { id: input.userId },
                        })];
                case 1:
                    user = _d.sent();
                    if (!user) {
                        throw new Error('User not found');
                    }
                    if (!((_c = input.organizationId) !== null && _c !== void 0)) return [3 /*break*/, 2];
                    _a = _c;
                    return [3 /*break*/, 7];
                case 2:
                    if (!input.invitedBy) return [3 /*break*/, 4];
                    return [4 /*yield*/, resolveOrganizationId(input.invitedBy)];
                case 3:
                    _b = _d.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, resolveOrganizationId(input.userId)];
                case 5:
                    _b = _d.sent();
                    _d.label = 6;
                case 6:
                    _a = (_b);
                    _d.label = 7;
                case 7:
                    organizationId = _a;
                    if (!organizationId) {
                        throw new Error('Organization context not found');
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.findUnique({
                            where: {
                                userId_organizationId: {
                                    userId: input.userId,
                                    organizationId: organizationId,
                                },
                            },
                        })];
                case 8:
                    existing = _d.sent();
                    if (existing) {
                        throw new Error('User is already a team member');
                    }
                    metadata = prepareMetadata(input.metadata);
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.create({
                            data: __assign({ userId: input.userId, organizationId: organizationId, role: input.role || 'Member', department: input.department, status: input.status || 'active', invitedBy: input.invitedBy, invitedAt: input.invitedBy ? new Date() : undefined }, (metadata ? { metadata: metadata } : {})),
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        })];
                case 9:
                    member = _d.sent();
                    logger_js_1.logger.info({ memberId: member.id, userId: input.userId, organizationId: organizationId, role: member.role }, 'Team member created');
                    return [2 /*return*/, member];
                case 10:
                    error_3 = _d.sent();
                    logger_js_1.logger.error({ error: error_3, userId: input.userId }, 'Failed to create team member');
                    throw error_3;
                case 11: return [2 /*return*/];
            }
        });
    });
}
function updateTeamMember(memberId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, data, merged, member, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.findUnique({
                            where: { id: memberId },
                        })];
                case 1:
                    existing = _a.sent();
                    if (!existing) {
                        throw new Error('Team member not found');
                    }
                    data = __assign(__assign(__assign({}, (input.role ? { role: input.role } : {})), (input.department ? { department: input.department } : {})), (input.status ? { status: input.status } : {}));
                    if (input.metadata !== undefined) {
                        if (input.metadata === null) {
                            data.metadata = client_1.Prisma.JsonNull;
                        }
                        else {
                            merged = mergeMetadata(existing.metadata, stripUndefined(input.metadata));
                            data.metadata = merged !== null && merged !== void 0 ? merged : client_1.Prisma.JsonNull;
                        }
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.update({
                            where: { id: memberId },
                            data: data,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    member = _a.sent();
                    logger_js_1.logger.info({ memberId: memberId, updates: input }, 'Team member updated');
                    return [2 /*return*/, member];
                case 3:
                    error_4 = _a.sent();
                    logger_js_1.logger.error({ error: error_4, memberId: memberId }, 'Failed to update team member');
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function removeTeamMember(memberId) {
    return __awaiter(this, void 0, void 0, function () {
        var member, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.findUnique({
                            where: { id: memberId },
                        })];
                case 1:
                    member = _a.sent();
                    if (!member) {
                        throw new Error('Team member not found');
                    }
                    // Don't allow removing the owner
                    if (member.role === 'Owner') {
                        throw new Error('Cannot remove team owner');
                    }
                    return [4 /*yield*/, prisma_js_1.prisma.teamMember.delete({
                            where: { id: memberId },
                        })];
                case 2:
                    _a.sent();
                    logger_js_1.logger.info({ memberId: memberId }, 'Team member removed');
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_5 = _a.sent();
                    logger_js_1.logger.error({ error: error_5, memberId: memberId }, 'Failed to remove team member');
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getTeamStats() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, total, byRole, byStatus, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            prisma_js_1.prisma.teamMember.count(),
                            prisma_js_1.prisma.teamMember.groupBy({
                                by: ['role'],
                                _count: true,
                            }),
                            prisma_js_1.prisma.teamMember.groupBy({
                                by: ['status'],
                                _count: true,
                            }),
                        ])];
                case 1:
                    _a = _b.sent(), total = _a[0], byRole = _a[1], byStatus = _a[2];
                    return [2 /*return*/, {
                            total: total,
                            byRole: byRole.reduce(function (acc, item) {
                                var _a;
                                return (__assign(__assign({}, acc), (_a = {}, _a[item.role] = item._count, _a)));
                            }, {}),
                            byStatus: byStatus.reduce(function (acc, item) {
                                var _a;
                                return (__assign(__assign({}, acc), (_a = {}, _a[item.status] = item._count, _a)));
                            }, {}),
                        }];
                case 2:
                    error_6 = _b.sent();
                    logger_js_1.logger.error({ error: error_6 }, 'Failed to fetch team stats');
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
