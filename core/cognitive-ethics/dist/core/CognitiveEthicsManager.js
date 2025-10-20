"use strict";
/**
 * CognitiveEthicsManager - Central orchestrator for ethics evaluation
 * Coordinates all evaluators and enforces ethical AI policies
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitiveEthicsManager = void 0;
var FairnessEvaluator_1 = require("../evaluators/FairnessEvaluator");
var SafetyToxicityEvaluator_1 = require("../evaluators/SafetyToxicityEvaluator");
var PrivacyEvaluator_1 = require("../evaluators/PrivacyEvaluator");
var crypto = require("crypto");
var CognitiveEthicsManager = /** @class */ (function () {
    function CognitiveEthicsManager(policy) {
        this.policy = policy;
        this.fairnessEvaluator = new FairnessEvaluator_1.FairnessEvaluator(policy);
        this.safetyEvaluator = new SafetyToxicityEvaluator_1.SafetyToxicityEvaluator(policy);
        this.privacyEvaluator = new PrivacyEvaluator_1.PrivacyEvaluator(policy);
    }
    /**
     * Comprehensive ethics evaluation
     */
    CognitiveEthicsManager.prototype.evaluate = function (context, input, output) {
        return __awaiter(this, void 0, void 0, function () {
            var evaluationId, timestamp, _a, fairness, safety, privacy, overallPassed, criticalViolations, attestation;
            var _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        evaluationId = this.generateEvaluationId();
                        timestamp = new Date().toISOString();
                        return [4 /*yield*/, Promise.all([
                                ((_b = this.policy.fairness) === null || _b === void 0 ? void 0 : _b.enabled)
                                    ? this.fairnessEvaluator.evaluateSingle(output, input)
                                    : Promise.resolve(null),
                                ((_c = this.policy.safety) === null || _c === void 0 ? void 0 : _c.enabled)
                                    ? this.safetyEvaluator.evaluate({ text: JSON.stringify(output) })
                                    : Promise.resolve(null),
                                ((_d = this.policy.privacy) === null || _d === void 0 ? void 0 : _d.enabled)
                                    ? this.privacyEvaluator.evaluate({
                                        text: JSON.stringify(output),
                                        tenantId: context.tenantId,
                                    })
                                    : Promise.resolve(null),
                            ])];
                    case 1:
                        _a = _h.sent(), fairness = _a[0], safety = _a[1], privacy = _a[2];
                        overallPassed = [
                            (_e = fairness === null || fairness === void 0 ? void 0 : fairness.passed) !== null && _e !== void 0 ? _e : true,
                            (_f = safety === null || safety === void 0 ? void 0 : safety.passed) !== null && _f !== void 0 ? _f : true,
                            (_g = privacy === null || privacy === void 0 ? void 0 : privacy.passed) !== null && _g !== void 0 ? _g : true,
                        ].every(Boolean);
                        criticalViolations = __spreadArray(__spreadArray([], ((safety === null || safety === void 0 ? void 0 : safety.violations.filter(function (v) { return v.score >= 0.8; })) || []), true), ((privacy === null || privacy === void 0 ? void 0 : privacy.violations.filter(function (v) { return v.severity === 'critical'; })) || []), true).length;
                        attestation = this.generateAttestation(evaluationId, context, overallPassed);
                        return [2 /*return*/, {
                                evaluationId: evaluationId,
                                timestamp: timestamp,
                                agentId: context.agentId,
                                agentType: context.agentType,
                                policyId: this.policy.id,
                                input: input,
                                output: output,
                                fairness: fairness,
                                safety: safety,
                                privacy: privacy,
                                grounding: null, // Placeholder
                                explainability: null, // Placeholder
                                overallPassed: overallPassed,
                                criticalViolations: criticalViolations,
                                attestation: attestation,
                            }];
                }
            });
        });
    };
    /**
     * Pre-execution check
     */
    CognitiveEthicsManager.prototype.preCheck = function (context, input) {
        return __awaiter(this, void 0, void 0, function () {
            var privacy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.privacyEvaluator.evaluate({
                            text: JSON.stringify(input),
                            tenantId: context.tenantId,
                        })];
                    case 1:
                        privacy = _a.sent();
                        return [2 /*return*/, {
                                passed: privacy.passed,
                                violations: privacy.violations,
                            }];
                }
            });
        });
    };
    /**
     * Post-execution check with full evaluation
     */
    CognitiveEthicsManager.prototype.postCheck = function (context, input, output) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.evaluate(context, input, output)];
            });
        });
    };
    /**
     * Generate unique evaluation ID
     */
    CognitiveEthicsManager.prototype.generateEvaluationId = function () {
        return "eval_".concat(Date.now(), "_").concat(crypto.randomBytes(8).toString('hex'));
    };
    /**
     * Generate cryptographic attestation
     */
    CognitiveEthicsManager.prototype.generateAttestation = function (evaluationId, context, passed) {
        var data = JSON.stringify({
            evaluationId: evaluationId,
            agentId: context.agentId,
            policyId: this.policy.id,
            passed: passed,
            timestamp: new Date().toISOString(),
        });
        var hash = crypto.createHash('sha256').update(data).digest('hex');
        var signature = this.signAttestation(hash);
        var merkleRoot = this.computeMerkleRoot([hash]);
        return {
            hash: hash,
            signature: signature,
            merkleRoot: merkleRoot,
            timestamp: new Date().toISOString(),
            policyVersion: this.policy.version,
        };
    };
    /**
     * Sign attestation (placeholder - should use proper key management)
     */
    CognitiveEthicsManager.prototype.signAttestation = function (hash) {
        // In production, use proper cryptographic signing with private keys
        return crypto.createHmac('sha256', 'ethics-key').update(hash).digest('hex');
    };
    /**
     * Compute Merkle root for attestation chain
     */
    CognitiveEthicsManager.prototype.computeMerkleRoot = function (hashes) {
        if (hashes.length === 0)
            return '';
        if (hashes.length === 1)
            return hashes[0];
        var combined = hashes.join('');
        return crypto.createHash('sha256').update(combined).digest('hex');
    };
    /**
     * Update policy at runtime
     */
    CognitiveEthicsManager.prototype.updatePolicy = function (policy) {
        this.policy = policy;
        this.fairnessEvaluator = new FairnessEvaluator_1.FairnessEvaluator(policy);
        this.safetyEvaluator = new SafetyToxicityEvaluator_1.SafetyToxicityEvaluator(policy);
        this.privacyEvaluator = new PrivacyEvaluator_1.PrivacyEvaluator(policy);
    };
    /**
     * Get current policy
     */
    CognitiveEthicsManager.prototype.getPolicy = function () {
        return this.policy;
    };
    return CognitiveEthicsManager;
}());
exports.CognitiveEthicsManager = CognitiveEthicsManager;
