"use strict";
/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Extension
 * Ethics-by-design framework with auditable, measurable guardrails
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.PrivacyEvaluator = exports.SafetyToxicityEvaluator = exports.FairnessEvaluator = exports.CognitiveEthicsManager = void 0;
// Core Manager
var CognitiveEthicsManager_1 = require("./core/CognitiveEthicsManager");
Object.defineProperty(exports, "CognitiveEthicsManager", { enumerable: true, get: function () { return CognitiveEthicsManager_1.CognitiveEthicsManager; } });
// Evaluators
var FairnessEvaluator_1 = require("./evaluators/FairnessEvaluator");
Object.defineProperty(exports, "FairnessEvaluator", { enumerable: true, get: function () { return FairnessEvaluator_1.FairnessEvaluator; } });
var SafetyToxicityEvaluator_1 = require("./evaluators/SafetyToxicityEvaluator");
Object.defineProperty(exports, "SafetyToxicityEvaluator", { enumerable: true, get: function () { return SafetyToxicityEvaluator_1.SafetyToxicityEvaluator; } });
var PrivacyEvaluator_1 = require("./evaluators/PrivacyEvaluator");
Object.defineProperty(exports, "PrivacyEvaluator", { enumerable: true, get: function () { return PrivacyEvaluator_1.PrivacyEvaluator; } });
// Types
__exportStar(require("./types"), exports);
// Version
exports.VERSION = '7.1.0';
