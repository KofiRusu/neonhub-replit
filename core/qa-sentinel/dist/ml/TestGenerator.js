"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLTestGenerator = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node"));
const stats_lite_1 = require("stats-lite");
class MLTestGenerator {
    constructor(config) {
        this.model = null;
        this.trainingData = [];
        this.featureStats = new Map();
        this.config = config;
    }
    async initialize() {
        // Create a simple neural network for test case generation
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
    }
    async train(telemetryData, failurePatterns) {
        if (!this.model)
            await this.initialize();
        // Prepare training data
        this.trainingData = [];
        // Calculate feature statistics
        this.calculateFeatureStats(telemetryData);
        // Generate training examples from telemetry and failure patterns
        for (const pattern of failurePatterns) {
            const features = this.extractFeatures(pattern, telemetryData);
            const label = pattern.riskScore > 0.7 ? 1 : 0; // High risk = needs test
            this.trainingData.push({ features, label });
        }
        // Add negative examples (normal patterns)
        const normalPatterns = this.generateNormalPatterns(telemetryData);
        for (const pattern of normalPatterns) {
            const features = this.extractFeatures(pattern, telemetryData);
            this.trainingData.push({ features, label: 0 });
        }
        if (this.trainingData.length > 0) {
            const { features, labels } = this.prepareTrainingData();
            await this.model.fit(features, labels, {
                epochs: 50,
                batchSize: 32,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
                        }
                    }
                }
            });
        }
    }
    calculateFeatureStats(telemetryData) {
        const metricsByType = new Map();
        for (const data of telemetryData) {
            if (!metricsByType.has(data.metric)) {
                metricsByType.set(data.metric, []);
            }
            metricsByType.get(data.metric).push(data.value);
        }
        for (const [metric, values] of metricsByType) {
            if (values.length > 1) {
                this.featureStats.set(metric, {
                    mean: (0, stats_lite_1.mean)(values),
                    std: (0, stats_lite_1.std)(values)
                });
            }
        }
    }
    extractFeatures(pattern, telemetryData) {
        const features = [];
        // Risk score
        features.push(pattern.riskScore);
        // Frequency (normalized)
        features.push(Math.min(pattern.frequency / 100, 1));
        // Related metrics statistics
        for (const metric of pattern.relatedMetrics.slice(0, 5)) {
            const metricData = telemetryData.filter(d => d.metric === metric);
            if (metricData.length > 0) {
                const values = metricData.map(d => d.value);
                features.push((0, stats_lite_1.mean)(values), (0, stats_lite_1.std)(values), (0, stats_lite_1.min)(values), (0, stats_lite_1.max)(values));
            }
            else {
                features.push(0, 0, 0, 0);
            }
        }
        // Pad to fixed size
        while (features.length < 10) {
            features.push(0);
        }
        return features.slice(0, 10);
    }
    generateNormalPatterns(telemetryData) {
        const patterns = [];
        const components = [...new Set(telemetryData.map(d => d.component))];
        for (const component of components) {
            patterns.push({
                id: `normal-${component}`,
                component,
                errorType: 'none',
                frequency: 0,
                lastOccurred: new Date(),
                relatedMetrics: [],
                riskScore: 0,
                suggestedTests: []
            });
        }
        return patterns;
    }
    prepareTrainingData() {
        const features = tf.tensor2d(this.trainingData.map(d => d.features));
        const labels = tf.tensor1d(this.trainingData.map(d => d.label));
        return { features, labels };
    }
    async generateTest(component, telemetryData) {
        if (!this.model)
            return null;
        // Create a mock failure pattern for prediction
        const mockPattern = {
            id: `predict-${Date.now()}`,
            component,
            errorType: 'predicted',
            frequency: 1,
            lastOccurred: new Date(),
            relatedMetrics: ['response_time', 'error_rate'],
            riskScore: 0.5,
            suggestedTests: []
        };
        const features = this.extractFeatures(mockPattern, telemetryData);
        const inputTensor = tf.tensor2d([features]);
        const prediction = this.model.predict(inputTensor);
        const confidence = (await prediction.data())[0];
        inputTensor.dispose();
        prediction.dispose();
        if (confidence > this.config.testGeneration.confidenceThreshold) {
            return this.createTestFromPrediction(component, confidence, telemetryData);
        }
        return null;
    }
    createTestFromPrediction(component, confidence, telemetryData) {
        const testId = `ml-test-${component}-${Date.now()}`;
        return {
            id: testId,
            name: `ML Generated Test: ${component} Resilience`,
            description: `Automatically generated test for ${component} based on ML analysis of telemetry patterns`,
            category: 'integration',
            priority: confidence > 0.8 ? 'high' : 'medium',
            component,
            scenario: {
                preconditions: [
                    `${component} service is operational`,
                    'Telemetry collection is active'
                ],
                steps: [
                    {
                        id: '1',
                        description: `Simulate load on ${component}`,
                        action: 'simulate_load',
                        parameters: { component, duration: 30000 },
                        expectedDuration: 30000
                    },
                    {
                        id: '2',
                        description: 'Monitor system metrics during load',
                        action: 'monitor_metrics',
                        parameters: { metrics: ['response_time', 'error_rate', 'cpu_usage'] },
                        expectedDuration: 5000
                    }
                ],
                assertions: [
                    {
                        type: 'less',
                        target: 'error_rate',
                        value: 0.05,
                        tolerance: 0.01
                    },
                    {
                        type: 'greater',
                        target: 'response_time',
                        value: 100
                    }
                ]
            },
            expectedResult: { resilient: true, errorRate: '< 5%', responseTime: '< 2000ms' },
            timeout: 60000,
            tags: ['ml-generated', 'resilience', 'load-test', component],
            generatedBy: 'ml',
            confidence,
            createdAt: new Date(),
            executionCount: 0,
            successRate: 0
        };
    }
    async predictTestNeed(component, currentMetrics) {
        if (!this.model)
            return 0;
        // Create features from current metrics
        const features = this.createFeaturesFromMetrics(component, currentMetrics);
        const inputTensor = tf.tensor2d([features]);
        const prediction = this.model.predict(inputTensor);
        const confidence = (await prediction.data())[0];
        inputTensor.dispose();
        prediction.dispose();
        return confidence;
    }
    createFeaturesFromMetrics(component, metrics) {
        const features = [];
        // Risk score (estimated)
        features.push(0.5);
        // Frequency (estimated)
        features.push(0.1);
        // Metric statistics
        for (const [metric, value] of Object.entries(metrics)) {
            const stats = this.featureStats.get(metric);
            if (stats) {
                const normalizedValue = (value - stats.mean) / stats.std;
                features.push(normalizedValue, stats.std, Math.min(value, 100), Math.max(value, 0));
            }
            else {
                features.push(value, 1, value, value);
            }
        }
        // Pad to fixed size
        while (features.length < 10) {
            features.push(0);
        }
        return features.slice(0, 10);
    }
    getModelStats() {
        return {
            trained: this.model !== null,
            // In a real implementation, you'd track these during training
            accuracy: undefined,
            loss: undefined
        };
    }
    async saveModel(path) {
        if (this.model) {
            await this.model.save(`file://${path}`);
        }
    }
    async loadModel(path) {
        try {
            this.model = await tf.loadLayersModel(`file://${path}`);
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });
        }
        catch (error) {
            console.error('Failed to load ML model:', error);
        }
    }
}
exports.MLTestGenerator = MLTestGenerator;
//# sourceMappingURL=TestGenerator.js.map