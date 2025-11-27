"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectById = connectById;
exports.mapJsonExtras = mapJsonExtras;
exports.teamUniqueWhere = teamUniqueWhere;
function connectById(id) {
    if (!id) {
        return undefined;
    }
    return { connect: { id: id } };
}
function mapJsonExtras(input, keep) {
    if (!input || typeof input !== "object") {
        return undefined;
    }
    var extras = {};
    for (var _i = 0, _a = Object.entries(input); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (!keep.includes(key) && value !== undefined) {
            extras[key] = value;
        }
    }
    return Object.keys(extras).length > 0 ? { metadata: extras } : undefined;
}
function teamUniqueWhere(params) {
    var slug = params.slug, organizationId = params.organizationId, name = params.name;
    if (slug) {
        return { slug: slug };
    }
    if (organizationId && name) {
        return {
            organizationId_name: {
                organizationId: organizationId,
                name: name,
            },
        };
    }
    throw new Error("teamUniqueWhere requires a slug or an organizationId/name pair");
}
