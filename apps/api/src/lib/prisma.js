"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseConnection = exports.prisma = void 0;
var prisma_js_1 = require("../db/prisma.js");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_js_1.prisma; } });
Object.defineProperty(exports, "checkDatabaseConnection", { enumerable: true, get: function () { return prisma_js_1.checkDatabaseConnection; } });
