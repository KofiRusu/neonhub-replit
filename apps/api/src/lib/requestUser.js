"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = getAuthenticatedUser;
exports.getAuthenticatedUserId = getAuthenticatedUserId;
var errors_js_1 = require("./errors.js");
function getAuthenticatedUser(req) {
    var user = req.user;
    if (!user) {
        throw new errors_js_1.AppError("Unauthorized", 401, "UNAUTHORIZED");
    }
    return user;
}
function getAuthenticatedUserId(req) {
    return getAuthenticatedUser(req).id;
}
