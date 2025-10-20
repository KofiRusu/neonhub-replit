"use strict";
/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Types
 * Comprehensive type definitions for ethics-by-design framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthicsPolicySchema = void 0;
var zod_1 = require("zod");
// ============================================================================
// Core Policy Types
// ============================================================================
exports.EthicsPolicySchema = zod_1.z.object({
    id: zod_1.z.string(),
    version: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    tenantId: zod_1.z.string().optional(),
    jurisdiction: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    fairness: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        demographicParityThreshold: zod_1.z.number().min(0).max(1).default(0.05),
        equalizedOddsThreshold: zod_1.z.number().min(0).max(1).default(0.05),
        protectedAttributes: zod_1.z.array(zod_1.z.string()).default(['gender', 'race', 'age']),
    }).optional(),
    safety: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        toxicityThreshold: zod_1.z.number().min(0).max(1).default(0.3),
        hateSpeechThreshold: zod_1.z.number().min(0).max(1).default(0.2),
        violenceThreshold: zod_1.z.number().min(0).max(1).default(0.3),
        selfHarmThreshold: zod_1.z.number().min(0).max(1).default(0.1),
        harassmentThreshold: zod_1.z.number().min(0).max(1).default(0.3),
    }).optional(),
    privacy: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        piiDetectionEnabled: zod_1.z.boolean().default(true),
        autoRedactionEnabled: zod_1.z.boolean().default(true),
        differentialPrivacyEnabled: zod_1.z.boolean().default(false),
        privacyBudgetEpsilon: zod_1.z.number().default(1.0),
        allowedPIITypes: zod_1.z.array(zod_1.z.string()).default([]),
    }).optional(),
    grounding: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        minConfidenceScore: zod_1.z.number().min(0).max(1).default(0.85),
        requireCitations: zod_1.z.boolean().default(true),
        maxHallucinationScore: zod_1.z.number().min(0).max(1).default(0.15),
    }).optional(),
    explainability: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        requireRationale: zod_1.z.boolean().default(true),
        captureShapValues: zod_1.z.boolean().default(false),
        generateCounterfactuals: zod_1.z.boolean().default(false),
    }).optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
