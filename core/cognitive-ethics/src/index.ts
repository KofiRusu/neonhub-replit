/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Extension
 * Ethics-by-design framework with auditable, measurable guardrails
 */

// Core Manager
export { CognitiveEthicsManager } from './core/CognitiveEthicsManager';

// Evaluators
export { FairnessEvaluator } from './evaluators/FairnessEvaluator';
export { SafetyToxicityEvaluator } from './evaluators/SafetyToxicityEvaluator';
export { PrivacyEvaluator } from './evaluators/PrivacyEvaluator';

// Types
export * from './types';

// Version
export const VERSION = '7.1.0';