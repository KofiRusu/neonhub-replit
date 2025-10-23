/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Types
 * Comprehensive type definitions for ethics-by-design framework
 */
import { z } from 'zod';
// ============================================================================
// Core Policy Types
// ============================================================================
export const EthicsPolicySchema = z.object({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    description: z.string(),
    tenantId: z.string().optional(),
    jurisdiction: z.string().optional(),
    enabled: z.boolean().default(true),
    fairness: z.object({
        enabled: z.boolean().default(true),
        demographicParityThreshold: z.number().min(0).max(1).default(0.05),
        equalizedOddsThreshold: z.number().min(0).max(1).default(0.05),
        protectedAttributes: z.array(z.string()).default(['gender', 'race', 'age']),
    }).optional(),
    safety: z.object({
        enabled: z.boolean().default(true),
        toxicityThreshold: z.number().min(0).max(1).default(0.3),
        hateSpeechThreshold: z.number().min(0).max(1).default(0.2),
        violenceThreshold: z.number().min(0).max(1).default(0.3),
        selfHarmThreshold: z.number().min(0).max(1).default(0.1),
        harassmentThreshold: z.number().min(0).max(1).default(0.3),
    }).optional(),
    privacy: z.object({
        enabled: z.boolean().default(true),
        piiDetectionEnabled: z.boolean().default(true),
        autoRedactionEnabled: z.boolean().default(true),
        differentialPrivacyEnabled: z.boolean().default(false),
        privacyBudgetEpsilon: z.number().default(1.0),
        allowedPIITypes: z.array(z.string()).default([]),
    }).optional(),
    grounding: z.object({
        enabled: z.boolean().default(true),
        minConfidenceScore: z.number().min(0).max(1).default(0.85),
        requireCitations: z.boolean().default(true),
        maxHallucinationScore: z.number().min(0).max(1).default(0.15),
    }).optional(),
    explainability: z.object({
        enabled: z.boolean().default(true),
        requireRationale: z.boolean().default(true),
        captureShapValues: z.boolean().default(false),
        generateCounterfactuals: z.boolean().default(false),
    }).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
//# sourceMappingURL=index.js.map