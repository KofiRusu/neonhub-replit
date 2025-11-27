"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVectorSql = toVectorSql;
function toVectorSql(vector) {
    if (!vector.length) {
        return "ARRAY[0]::vector";
    }
    var safe = vector.map(function (value) { return (Number.isFinite(value) ? Number(value) : 0); });
    return "ARRAY[".concat(safe.join(", "), "]::vector");
}
