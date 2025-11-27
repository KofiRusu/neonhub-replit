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
var zod_1 = require("zod");
var http_js_1 = require("../lib/http.js");
var personaService = require("../services/persona.service.js");
var router = (0, express_1.Router)();
var personaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    summary: zod_1.z.string().max(2000).optional(),
});
var personaUpdateSchema = personaSchema.partial();
router.get("/", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var personas, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, personaService.listPersonas()];
            case 1:
                personas = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(personas))];
            case 2:
                error_1 = _a.sent();
                message = error_1 instanceof Error ? error_1.message : "Failed to fetch personas";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, persona, error_2, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid persona id").body)];
                }
                return [4 /*yield*/, personaService.getPersonaById(id)];
            case 1:
                persona = _a.sent();
                if (!persona) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Persona not found").body)];
                }
                return [2 /*return*/, res.json((0, http_js_1.ok)(persona))];
            case 2:
                error_2 = _a.sent();
                message = error_2 instanceof Error ? error_2.message : "Failed to fetch persona";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, persona, error_3, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                payload = personaSchema.parse(req.body);
                return [4 /*yield*/, personaService.createPersona({
                        name: payload.name,
                        summary: (_a = payload.summary) !== null && _a !== void 0 ? _a : null,
                    })];
            case 1:
                persona = _d.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(persona))];
            case 2:
                error_3 = _d.sent();
                if (error_3 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_3.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request body").body)];
                }
                message = error_3 instanceof Error ? error_3.message : "Failed to create persona";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, payload, persona, error_4, message, status_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid persona id").body)];
                }
                payload = personaUpdateSchema.parse(req.body);
                return [4 /*yield*/, personaService.updatePersona(id, payload)];
            case 1:
                persona = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(persona))];
            case 2:
                error_4 = _c.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_4.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid request body").body)];
                }
                message = error_4 instanceof Error ? error_4.message : "Failed to update persona";
                status_1 = message.toLowerCase().includes("not found") ? 404 : 500;
                return [2 /*return*/, res.status(status_1).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_5, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)("Invalid persona id").body)];
                }
                return [4 /*yield*/, personaService.deletePersona(id)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ deleted: true }))];
            case 2:
                error_5 = _a.sent();
                message = error_5 instanceof Error ? error_5.message : "Failed to delete persona";
                status_2 = message.toLowerCase().includes("not found") ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
