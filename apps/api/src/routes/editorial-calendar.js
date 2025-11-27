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
var express_1 = require("express");
var zod_1 = require("zod");
var http_js_1 = require("../lib/http.js");
var editorialService = require("../services/editorial-calendar.service.js");
var router = (0, express_1.Router)();
var editorialCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    publishAt: zod_1.z.string().datetime({ message: "publishAt must be an ISO-8601 date string" }),
    priority: zod_1.z.number().int().min(0).max(100).optional(),
    status: zod_1.z.string().min(1).optional(),
    personaId: zod_1.z.number().int().positive().optional(),
});
var editorialUpdateSchema = editorialCreateSchema.partial();
router.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var personaIdParam, statusParam, personaId, status_1, filters, entries, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                personaIdParam = req.query.personaId;
                statusParam = req.query.status;
                personaId = typeof personaIdParam === "string" ? Number(personaIdParam) : undefined;
                status_1 = typeof statusParam === "string" ? statusParam : undefined;
                filters = __assign(__assign({}, (personaId !== undefined && !Number.isNaN(personaId) ? { personaId: personaId } : {})), (status_1 ? { status: status_1 } : {}));
                return [4 /*yield*/, editorialService.listEditorialEntries(filters)];
            case 1:
                entries = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(entries))];
            case 2:
                error_1 = _a.sent();
                message = error_1 instanceof Error ? error_1.message : "Failed to fetch editorial calendar";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, entry, error_2, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid editorial calendar id").body)];
                }
                return [4 /*yield*/, editorialService.getEditorialEntry(id)];
            case 1:
                entry = _a.sent();
                if (!entry) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Editorial calendar entry not found").body)];
                }
                return [2 /*return*/, res.json((0, http_js_1.ok)(entry))];
            case 2:
                error_2 = _a.sent();
                message = error_2 instanceof Error ? error_2.message : "Failed to fetch editorial calendar entry";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, entry, error_3, message;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                payload = editorialCreateSchema.parse(req.body);
                return [4 /*yield*/, editorialService.createEditorialEntry({
                        title: payload.title,
                        publishAt: new Date(payload.publishAt),
                        priority: payload.priority,
                        status: payload.status,
                        personaId: payload.personaId,
                    })];
            case 1:
                entry = _c.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(entry))];
            case 2:
                error_3 = _c.sent();
                if (error_3 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_3.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid request body").body)];
                }
                message = error_3 instanceof Error ? error_3.message : "Failed to create editorial entry";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, payload, entry, error_4, message, status_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid editorial calendar id").body)];
                }
                payload = editorialUpdateSchema.parse(req.body);
                return [4 /*yield*/, editorialService.updateEditorialEntry(id, __assign(__assign({}, payload), { publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined }))];
            case 1:
                entry = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(entry))];
            case 2:
                error_4 = _c.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_4.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid request body").body)];
                }
                message = error_4 instanceof Error ? error_4.message : "Failed to update editorial entry";
                status_2 = message.toLowerCase().includes("not found") ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_5, message, status_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid editorial calendar id").body)];
                }
                return [4 /*yield*/, editorialService.deleteEditorialEntry(id)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ deleted: true }))];
            case 2:
                error_5 = _a.sent();
                message = error_5 instanceof Error ? error_5.message : "Failed to delete editorial entry";
                status_3 = message.toLowerCase().includes("not found") ? 404 : 500;
                return [2 /*return*/, res.status(status_3).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
