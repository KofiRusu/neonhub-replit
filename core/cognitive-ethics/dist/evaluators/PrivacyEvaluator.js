"use strict";
/**
 * PrivacyEvaluator - Protects user privacy through PII detection and differential privacy
 * Implements PII detection/redaction and differential privacy budget management
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
exports.PrivacyEvaluator = void 0;
var PrivacyEvaluator = /** @class */ (function () {
    function PrivacyEvaluator(policy) {
        // PII pattern matchers
        this.PII_PATTERNS = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
            ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
            passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
            driverLicense: /\b[A-Z]{1,2}\d{5,8}\b/g,
            bankAccount: /\b\d{8,17}\b/g,
            postalCode: /\b\d{5}(-\d{4})?\b/g,
            name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
            address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
        };
        // Privacy budget tracker (per tenant/user)
        this.privacyBudgets = new Map();
        this.policy = policy;
    }
    /**
     * Evaluate privacy metrics for content
     */
    PrivacyEvaluator.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var piiDetected, violations, detections, allowedTypes_1, unauthorizedPII, privacyBudgetRemaining, budgetKey, result;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this.policy.privacy) === null || _a === void 0 ? void 0 : _a.enabled)) {
                    return [2 /*return*/, this.getPassingMetrics()];
                }
                piiDetected = [];
                violations = [];
                // PII Detection
                if (this.policy.privacy.piiDetectionEnabled) {
                    detections = this.detectPII(context.text);
                    piiDetected.push.apply(piiDetected, detections);
                    allowedTypes_1 = this.policy.privacy.allowedPIITypes || [];
                    unauthorizedPII = detections.filter(function (d) { return !allowedTypes_1.includes(d.type); });
                    if (unauthorizedPII.length > 0) {
                        violations.push({
                            type: 'pii_leak',
                            details: "Detected ".concat(unauthorizedPII.length, " unauthorized PII types: ").concat(unauthorizedPII.map(function (p) { return p.type; }).join(', ')),
                            severity: this.calculatePIISeverity(unauthorizedPII),
                        });
                    }
                }
                privacyBudgetRemaining = 1.0;
                if (this.policy.privacy.differentialPrivacyEnabled) {
                    budgetKey = this.getBudgetKey(context);
                    result = this.checkPrivacyBudget(budgetKey, this.policy.privacy.privacyBudgetEpsilon);
                    privacyBudgetRemaining = result.remaining;
                    if (!result.allowed) {
                        violations.push({
                            type: 'budget_exceeded',
                            details: "Privacy budget exhausted for ".concat(budgetKey),
                            severity: 'critical',
                        });
                    }
                }
                return [2 /*return*/, {
                        piiDetected: piiDetected,
                        privacyBudgetRemaining: privacyBudgetRemaining,
                        passed: violations.length === 0,
                        violations: violations,
                    }];
            });
        });
    };
    /**
     * Detect PII in text using pattern matching
     */
    PrivacyEvaluator.prototype.detectPII = function (text) {
        var detections = [];
        for (var _i = 0, _a = Object.entries(this.PII_PATTERNS); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], pattern = _b[1];
            var matches = Array.from(text.matchAll(pattern));
            for (var _c = 0, matches_1 = matches; _c < matches_1.length; _c++) {
                var match = matches_1[_c];
                if (match.index !== undefined) {
                    detections.push({
                        type: type,
                        value: match[0],
                        location: {
                            start: match.index,
                            end: match.index + match[0].length,
                        },
                        confidence: this.calculateConfidence(type, match[0]),
                        redacted: false,
                    });
                }
            }
        }
        return detections;
    };
    /**
     * Calculate confidence score for PII detection
     */
    PrivacyEvaluator.prototype.calculateConfidence = function (type, value) {
        // Higher confidence for well-defined patterns
        var highConfidenceTypes = ['email', 'ssn', 'creditCard', 'phone'];
        var mediumConfidenceTypes = ['ipAddress', 'postalCode'];
        if (highConfidenceTypes.includes(type)) {
            return 0.95;
        }
        else if (mediumConfidenceTypes.includes(type)) {
            return 0.80;
        }
        // Lower confidence for ambiguous patterns like names
        return 0.65;
    };
    /**
     * Calculate severity of PII violations
     */
    PrivacyEvaluator.prototype.calculatePIISeverity = function (detections) {
        var criticalTypes = ['ssn', 'creditCard', 'bankAccount', 'passport'];
        var highTypes = ['driverLicense', 'phone', 'email'];
        if (detections.some(function (d) { return criticalTypes.includes(d.type); })) {
            return 'critical';
        }
        else if (detections.some(function (d) { return highTypes.includes(d.type); })) {
            return 'high';
        }
        else if (detections.length > 5) {
            return 'high';
        }
        else if (detections.length > 2) {
            return 'medium';
        }
        return 'low';
    };
    /**
     * Redact PII from text
     */
    PrivacyEvaluator.prototype.redactPII = function (text, detections) {
        var _a;
        if (!((_a = this.policy.privacy) === null || _a === void 0 ? void 0 : _a.autoRedactionEnabled)) {
            return text;
        }
        var redactedText = text;
        // Sort detections by position (descending) to avoid offset issues
        var sortedDetections = __spreadArray([], detections, true).sort(function (a, b) { return b.location.start - a.location.start; });
        for (var _i = 0, sortedDetections_1 = sortedDetections; _i < sortedDetections_1.length; _i++) {
            var detection = sortedDetections_1[_i];
            var redactionMask = this.getRedactionMask(detection.type);
            redactedText =
                redactedText.slice(0, detection.location.start) +
                    redactionMask +
                    redactedText.slice(detection.location.end);
            detection.redacted = true;
        }
        return redactedText;
    };
    /**
     * Get redaction mask for PII type
     */
    PrivacyEvaluator.prototype.getRedactionMask = function (type) {
        var masks = {
            email: '[EMAIL_REDACTED]',
            phone: '[PHONE_REDACTED]',
            ssn: '[SSN_REDACTED]',
            creditCard: '[CARD_REDACTED]',
            ipAddress: '[IP_REDACTED]',
            passport: '[PASSPORT_REDACTED]',
            driverLicense: '[LICENSE_REDACTED]',
            bankAccount: '[ACCOUNT_REDACTED]',
            postalCode: '[ZIP_REDACTED]',
            name: '[NAME_REDACTED]',
            address: '[ADDRESS_REDACTED]',
        };
        return masks[type] || '[PII_REDACTED]';
    };
    /**
     * Check differential privacy budget
     */
    PrivacyEvaluator.prototype.checkPrivacyBudget = function (key, epsilon) {
        var currentBudget = this.privacyBudgets.get(key) || 0;
        var remaining = Math.max(0, epsilon - currentBudget);
        return {
            allowed: remaining > 0,
            remaining: remaining / epsilon, // Normalized to 0-1
        };
    };
    /**
     * Consume privacy budget for a query
     */
    PrivacyEvaluator.prototype.consumePrivacyBudget = function (key, cost) {
        var _a;
        var currentBudget = this.privacyBudgets.get(key) || 0;
        var newBudget = currentBudget + cost;
        var epsilon = ((_a = this.policy.privacy) === null || _a === void 0 ? void 0 : _a.privacyBudgetEpsilon) || 1.0;
        if (newBudget <= epsilon) {
            this.privacyBudgets.set(key, newBudget);
            return {
                success: true,
                remaining: (epsilon - newBudget) / epsilon,
            };
        }
        return {
            success: false,
            remaining: Math.max(0, (epsilon - currentBudget) / epsilon),
        };
    };
    /**
     * Reset privacy budget for a key
     */
    PrivacyEvaluator.prototype.resetPrivacyBudget = function (key) {
        this.privacyBudgets.delete(key);
    };
    /**
     * Get budget key from context
     */
    PrivacyEvaluator.prototype.getBudgetKey = function (context) {
        // Use tenant + user for granular privacy tracking
        if (context.userId) {
            return "".concat(context.tenantId || 'default', ":").concat(context.userId);
        }
        return context.tenantId || 'default';
    };
    /**
     * Return passing metrics when privacy is disabled
     */
    PrivacyEvaluator.prototype.getPassingMetrics = function () {
        return {
            piiDetected: [],
            privacyBudgetRemaining: 1.0,
            passed: true,
            violations: [],
        };
    };
    /**
     * Evaluate and auto-redact in one operation
     */
    PrivacyEvaluator.prototype.evaluateAndRedact = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, redactedText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.evaluate(context)];
                    case 1:
                        metrics = _a.sent();
                        redactedText = this.redactPII(context.text, metrics.piiDetected);
                        return [2 /*return*/, { metrics: metrics, redactedText: redactedText }];
                }
            });
        });
    };
    /**
     * Batch evaluate multiple contexts
     */
    PrivacyEvaluator.prototype.evaluateBatch = function (contexts) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(contexts.map(function (ctx) { return _this.evaluate(ctx); }))];
            });
        });
    };
    /**
     * Add noise for differential privacy (Laplace mechanism)
     */
    PrivacyEvaluator.prototype.addNoise = function (value, sensitivity, epsilon) {
        var scale = sensitivity / epsilon;
        // Laplace noise: sample from Laplace(0, scale)
        var u = Math.random() - 0.5;
        var noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
        return value + noise;
    };
    /**
     * Check if text contains sensitive information
     */
    PrivacyEvaluator.prototype.containsSensitiveInfo = function (text) {
        var detections = this.detectPII(text);
        return detections.length > 0;
    };
    /**
     * Get privacy risk score for text
     */
    PrivacyEvaluator.prototype.getPrivacyRiskScore = function (text) {
        var detections = this.detectPII(text);
        if (detections.length === 0)
            return 0;
        // Weight by PII type severity
        var criticalWeight = 0.4;
        var highWeight = 0.25;
        var mediumWeight = 0.15;
        var lowWeight = 0.05;
        var criticalTypes = ['ssn', 'creditCard', 'bankAccount', 'passport'];
        var highTypes = ['driverLicense', 'phone', 'email'];
        var mediumTypes = ['ipAddress', 'postalCode', 'address'];
        var score = 0;
        for (var _i = 0, detections_1 = detections; _i < detections_1.length; _i++) {
            var detection = detections_1[_i];
            if (criticalTypes.includes(detection.type)) {
                score += criticalWeight;
            }
            else if (highTypes.includes(detection.type)) {
                score += highWeight;
            }
            else if (mediumTypes.includes(detection.type)) {
                score += mediumWeight;
            }
            else {
                score += lowWeight;
            }
        }
        return Math.min(score, 1.0);
    };
    return PrivacyEvaluator;
}());
exports.PrivacyEvaluator = PrivacyEvaluator;
