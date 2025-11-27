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
exports.documentsRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var documentsService = require("../services/documents.service.js");
var http_js_1 = require("../lib/http.js");
exports.documentsRouter = (0, express_1.Router)();
// Validation schemas
var createDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    content: zod_1.z.string(),
    type: zod_1.z.enum(['general', 'contract', 'proposal', 'report']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().optional(),
    type: zod_1.z.enum(['general', 'contract', 'proposal', 'report']).optional(),
    status: zod_1.z.enum(['draft', 'review', 'approved', 'archived']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// POST /documents - Create new document
exports.documentsRouter.post('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, document_1, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                validatedData = createDocumentSchema.parse(req.body);
                return [4 /*yield*/, documentsService.createDocument(req.user.id, validatedData)];
            case 1:
                document_1 = _a.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(document_1))];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_1.errors[0].message).body)];
                }
                message = error_1 instanceof Error ? error_1.message : 'Failed to create document';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /documents - List documents
exports.documentsRouter.get('/', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_1, type, filters, documents, error_2, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, status_1 = _a.status, type = _a.type;
                filters = {};
                if (status_1 && typeof status_1 === 'string') {
                    filters.status = status_1;
                }
                if (type && typeof type === 'string') {
                    filters.type = type;
                }
                return [4 /*yield*/, documentsService.getDocuments(req.user.id, filters)];
            case 1:
                documents = _b.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(documents))];
            case 2:
                error_2 = _b.sent();
                message = error_2 instanceof Error ? error_2.message : 'Failed to fetch documents';
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /documents/:id - Get specific document
exports.documentsRouter.get('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var document_2, error_3, message, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, documentsService.getDocumentById(req.params.id, req.user.id)];
            case 1:
                document_2 = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(document_2))];
            case 2:
                error_3 = _a.sent();
                message = error_3 instanceof Error ? error_3.message : 'Failed to fetch document';
                status_2 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_2).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /documents/:id - Update document
exports.documentsRouter.put('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatedData, document_3, error_4, message, status_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                validatedData = updateDocumentSchema.parse(req.body);
                return [4 /*yield*/, documentsService.updateDocument(req.params.id, req.user.id, validatedData)];
            case 1:
                document_3 = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(document_3))];
            case 2:
                error_4 = _a.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)(error_4.errors[0].message).body)];
                }
                message = error_4 instanceof Error ? error_4.message : 'Failed to update document';
                status_3 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_3).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /documents/:id/version - Create new version
exports.documentsRouter.post('/:id/version', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newVersion, error_5, message, status_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, documentsService.createDocumentVersion(req.params.id, req.user.id)];
            case 1:
                newVersion = _a.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(newVersion))];
            case 2:
                error_5 = _a.sent();
                message = error_5 instanceof Error ? error_5.message : 'Failed to create document version';
                status_4 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_4).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /documents/:id - Delete document
exports.documentsRouter.delete('/:id', auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_6, message, status_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, documentsService.deleteDocument(req.params.id, req.user.id)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_6 = _a.sent();
                message = error_6 instanceof Error ? error_6.message : 'Failed to delete document';
                status_5 = message.includes('not found') ? 404 : 500;
                return [2 /*return*/, res.status(status_5).json((0, http_js_1.fail)(message))];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.documentsRouter;
