"use strict";
/**
 * FairnessEvaluator - Implements fairness metrics for AI systems
 * Evaluates demographic parity, equalized odds, and false positive/negative rates
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FairnessEvaluator = void 0;
var FairnessEvaluator = /** @class */ (function () {
    function FairnessEvaluator(policy) {
        this.policy = policy;
    }
    /**
     * Evaluate fairness metrics for a set of predictions
     */
    FairnessEvaluator.prototype.evaluate = function (predictions) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, protectedAttributes, _i, protectedAttributes_1, attribute, groups, dpGap, eoGap, fprGap_1, fnrGap_1, demographicParity, equalizedOdds, fprGap, fnrGap;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.enabled)) {
                    return [2 /*return*/, this.getPassingMetrics()];
                }
                violations = [];
                protectedAttributes = this.policy.fairness.protectedAttributes || [];
                // Calculate metrics for each protected attribute
                for (_i = 0, protectedAttributes_1 = protectedAttributes; _i < protectedAttributes_1.length; _i++) {
                    attribute = protectedAttributes_1[_i];
                    groups = this.getUniqueGroups(predictions, attribute);
                    if (groups.length < 2)
                        continue;
                    dpGap = this.calculateDemographicParity(predictions, attribute, groups);
                    if (dpGap > this.policy.fairness.demographicParityThreshold) {
                        violations.push({
                            metric: 'demographic_parity',
                            value: dpGap,
                            threshold: this.policy.fairness.demographicParityThreshold,
                            protectedAttribute: attribute,
                            groups: groups,
                        });
                    }
                    eoGap = this.calculateEqualizedOdds(predictions, attribute, groups);
                    if (eoGap > this.policy.fairness.equalizedOddsThreshold) {
                        violations.push({
                            metric: 'equalized_odds',
                            value: eoGap,
                            threshold: this.policy.fairness.equalizedOddsThreshold,
                            protectedAttribute: attribute,
                            groups: groups,
                        });
                    }
                    fprGap_1 = this.calculateFalsePositiveRateGap(predictions, attribute, groups);
                    if (fprGap_1 > this.policy.fairness.equalizedOddsThreshold) {
                        violations.push({
                            metric: 'false_positive_rate_gap',
                            value: fprGap_1,
                            threshold: this.policy.fairness.equalizedOddsThreshold,
                            protectedAttribute: attribute,
                            groups: groups,
                        });
                    }
                    fnrGap_1 = this.calculateFalseNegativeRateGap(predictions, attribute, groups);
                    if (fnrGap_1 > this.policy.fairness.equalizedOddsThreshold) {
                        violations.push({
                            metric: 'false_negative_rate_gap',
                            value: fnrGap_1,
                            threshold: this.policy.fairness.equalizedOddsThreshold,
                            protectedAttribute: attribute,
                            groups: groups,
                        });
                    }
                }
                demographicParity = this.calculateOverallDemographicParity(predictions);
                equalizedOdds = this.calculateOverallEqualizedOdds(predictions);
                fprGap = this.calculateOverallFPRGap(predictions);
                fnrGap = this.calculateOverallFNRGap(predictions);
                return [2 /*return*/, {
                        demographicParity: demographicParity,
                        equalizedOdds: equalizedOdds,
                        falsePositiveRateGap: fprGap,
                        falseNegativeRateGap: fnrGap,
                        passed: violations.length === 0,
                        violations: violations,
                    }];
            });
        });
    };
    /**
     * Calculate demographic parity gap for a protected attribute
     * Demographic Parity: P(Ŷ=1|A=a) ≈ P(Ŷ=1|A=b)
     */
    FairnessEvaluator.prototype.calculateDemographicParity = function (predictions, attribute, groups) {
        var positiveRates = groups.map(function (group) {
            var groupPredictions = predictions.filter(function (p) { return p.protectedAttributes[attribute] === group; });
            var positives = groupPredictions.filter(function (p) { return p.prediction; }).length;
            return positives / groupPredictions.length;
        });
        return Math.max.apply(Math, positiveRates) - Math.min.apply(Math, positiveRates);
    };
    /**
     * Calculate equalized odds gap
     * Equalized Odds: P(Ŷ=1|Y=y,A=a) ≈ P(Ŷ=1|Y=y,A=b) for all y
     */
    FairnessEvaluator.prototype.calculateEqualizedOdds = function (predictions, attribute, groups) {
        var tprGap = this.calculateTruePositiveRateGap(predictions, attribute, groups);
        var fprGap = this.calculateFalsePositiveRateGap(predictions, attribute, groups);
        return Math.max(tprGap, fprGap);
    };
    /**
     * Calculate true positive rate gap
     */
    FairnessEvaluator.prototype.calculateTruePositiveRateGap = function (predictions, attribute, groups) {
        var tprs = groups.map(function (group) {
            var groupPositives = predictions.filter(function (p) { return p.protectedAttributes[attribute] === group && p.actualLabel === true; });
            if (groupPositives.length === 0)
                return 0;
            var truePositives = groupPositives.filter(function (p) { return p.prediction === true; }).length;
            return truePositives / groupPositives.length;
        });
        return Math.max.apply(Math, tprs) - Math.min.apply(Math, tprs);
    };
    /**
     * Calculate false positive rate gap
     */
    FairnessEvaluator.prototype.calculateFalsePositiveRateGap = function (predictions, attribute, groups) {
        var fprs = groups.map(function (group) {
            var groupNegatives = predictions.filter(function (p) { return p.protectedAttributes[attribute] === group && p.actualLabel === false; });
            if (groupNegatives.length === 0)
                return 0;
            var falsePositives = groupNegatives.filter(function (p) { return p.prediction === true; }).length;
            return falsePositives / groupNegatives.length;
        });
        return Math.max.apply(Math, fprs) - Math.min.apply(Math, fprs);
    };
    /**
     * Calculate false negative rate gap
     */
    FairnessEvaluator.prototype.calculateFalseNegativeRateGap = function (predictions, attribute, groups) {
        var fnrs = groups.map(function (group) {
            var groupPositives = predictions.filter(function (p) { return p.protectedAttributes[attribute] === group && p.actualLabel === true; });
            if (groupPositives.length === 0)
                return 0;
            var falseNegatives = groupPositives.filter(function (p) { return p.prediction === false; }).length;
            return falseNegatives / groupPositives.length;
        });
        return Math.max.apply(Math, fnrs) - Math.min.apply(Math, fnrs);
    };
    /**
     * Calculate overall demographic parity across all protected attributes
     */
    FairnessEvaluator.prototype.calculateOverallDemographicParity = function (predictions) {
        var _this = this;
        var _a;
        var protectedAttributes = ((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.protectedAttributes) || [];
        var gaps = protectedAttributes.map(function (attr) {
            var groups = _this.getUniqueGroups(predictions, attr);
            return _this.calculateDemographicParity(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max.apply(Math, gaps) : 0;
    };
    /**
     * Calculate overall equalized odds across all protected attributes
     */
    FairnessEvaluator.prototype.calculateOverallEqualizedOdds = function (predictions) {
        var _this = this;
        var _a;
        var protectedAttributes = ((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.protectedAttributes) || [];
        var gaps = protectedAttributes.map(function (attr) {
            var groups = _this.getUniqueGroups(predictions, attr);
            return _this.calculateEqualizedOdds(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max.apply(Math, gaps) : 0;
    };
    /**
     * Calculate overall false positive rate gap
     */
    FairnessEvaluator.prototype.calculateOverallFPRGap = function (predictions) {
        var _this = this;
        var _a;
        var protectedAttributes = ((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.protectedAttributes) || [];
        var gaps = protectedAttributes.map(function (attr) {
            var groups = _this.getUniqueGroups(predictions, attr);
            return _this.calculateFalsePositiveRateGap(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max.apply(Math, gaps) : 0;
    };
    /**
     * Calculate overall false negative rate gap
     */
    FairnessEvaluator.prototype.calculateOverallFNRGap = function (predictions) {
        var _this = this;
        var _a;
        var protectedAttributes = ((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.protectedAttributes) || [];
        var gaps = protectedAttributes.map(function (attr) {
            var groups = _this.getUniqueGroups(predictions, attr);
            return _this.calculateFalseNegativeRateGap(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max.apply(Math, gaps) : 0;
    };
    /**
     * Get unique groups for a protected attribute
     */
    FairnessEvaluator.prototype.getUniqueGroups = function (predictions, attribute) {
        var groups = new Set();
        predictions.forEach(function (p) {
            if (p.protectedAttributes[attribute]) {
                groups.add(p.protectedAttributes[attribute]);
            }
        });
        return Array.from(groups);
    };
    /**
     * Return passing metrics when fairness is disabled
     */
    FairnessEvaluator.prototype.getPassingMetrics = function () {
        return {
            demographicParity: 0,
            equalizedOdds: 0,
            falsePositiveRateGap: 0,
            falseNegativeRateGap: 0,
            passed: true,
            violations: [],
        };
    };
    /**
     * Evaluate fairness for a single prediction (simplified)
     */
    FairnessEvaluator.prototype.evaluateSingle = function (prediction, context) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, protectedAttributes, _i, protectedAttributes_2, attr;
            var _a;
            return __generator(this, function (_b) {
                // For single predictions, we can only do basic checks
                // Full fairness metrics require a batch of predictions
                if (!((_a = this.policy.fairness) === null || _a === void 0 ? void 0 : _a.enabled)) {
                    return [2 /*return*/, this.getPassingMetrics()];
                }
                violations = [];
                protectedAttributes = this.policy.fairness.protectedAttributes || [];
                for (_i = 0, protectedAttributes_2 = protectedAttributes; _i < protectedAttributes_2.length; _i++) {
                    attr = protectedAttributes_2[_i];
                    if (context[attr]) {
                        // Log for batch analysis but don't fail single prediction
                        console.log("Protected attribute ".concat(attr, " present in prediction context"));
                    }
                }
                return [2 /*return*/, {
                        demographicParity: 0,
                        equalizedOdds: 0,
                        falsePositiveRateGap: 0,
                        falseNegativeRateGap: 0,
                        passed: violations.length === 0,
                        violations: violations,
                    }];
            });
        });
    };
    return FairnessEvaluator;
}());
exports.FairnessEvaluator = FairnessEvaluator;
