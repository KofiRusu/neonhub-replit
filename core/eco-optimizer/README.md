# Eco-Optimizer Module

> Energy usage tracking and resource efficiency optimization for sustainable operations

The Eco-Optimizer module provides comprehensive tools for monitoring energy consumption, calculating carbon footprints, optimizing resource utilization, and generating sustainability reports across cloud infrastructure.

## Features

- **Energy Monitoring**: Real-time and historical energy usage tracking across AWS, Azure, and GCP
- **Carbon Footprint Calculation**: Accurate CO2e emissions calculation with region-specific factors
- **Resource Optimization**: AI-powered recommendations for reducing energy consumption and costs
- **Efficiency Analysis**: Benchmarking against industry standards (PUE, CUE, WUE metrics)
- **Sustainability Reporting**: Comprehensive reports with goal tracking and certifications
- **Green AI Advisor**: Specialized recommendations for sustainable AI/ML operations

## Installation

```bash
npm install @neonhub/eco-optimizer
```

## Quick Start

```typescript
import {
  EnergyMonitor,
  CarbonFootprintCalculator,
  ResourceOptimizer,
  EfficiencyAnalyzer,
  SustainabilityReporter,
  GreenAIAdvisor
} from '@neonhub/eco-optimizer';
import winston from 'winston';

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Initialize components
const energyMonitor = new EnergyMonitor(logger);
const carbonCalculator = new CarbonFootprintCalculator(logger);
const resourceOptimizer = new ResourceOptimizer(logger);
const efficiencyAnalyzer = new EfficiencyAnalyzer(logger);
const sustainabilityReporter = new SustainabilityReporter(logger);
const greenAIAdvisor = new GreenAIAdvisor(logger);

// Start monitoring
await energyMonitor.initialize({
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: 'us-east-1'
  },
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
    tenantId: process.env.AZURE_TENANT_ID!
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID!,
    keyFilename: process.env.GCP_KEY_FILE
  }
});

energyMonitor.startMonitoring(5); // Monitor every 5 minutes
```

## Core Components

### EnergyMonitor

Tracks energy consumption across cloud providers in real-time.

```typescript
// Get energy usage data
const energyUsage = await energyMonitor.getEnergyUsage(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

console.log(`Total energy consumed: ${energyUsage.total} kWh`);
console.log(`By provider:`, energyUsage.byProvider);
console.log(`By resource type:`, energyUsage.byResourceType);

// Calculate average PUE
const avgPUE = await energyMonitor.calculateAveragePUE();
console.log(`Average PUE: ${avgPUE.toFixed(2)}`);
```

### CarbonFootprintCalculator

Calculates carbon emissions based on energy usage.

```typescript
// Calculate carbon footprint
const footprint = await carbonCalculator.calculateFootprint(energyUsage);

console.log(`Total emissions: ${footprint.totalEmissions.toFixed(2)} kg CO2e`);
console.log(`Net emissions (after offsets): ${footprint.netEmissions.toFixed(2)} kg CO2e`);

// Generate carbon report
const carbonReport = await carbonCalculator.generateReport(
  footprint,
  previousFootprint,
  startDate,
  endDate
);

console.log(`Change from previous period: ${carbonReport.trends.change.toFixed(1)}%`);
console.log('Recommendations:', carbonReport.recommendations);
```

### ResourceOptimizer

Analyzes resource utilization and provides optimization recommendations.

```typescript
// Analyze resources
const resources: ResourceUtilization[] = [
  {
    resourceId: 'i-1234567890',
    resourceType: ResourceType.COMPUTE,
    provider: CloudProvider.AWS,
    region: 'us-east-1',
    utilizationRate: 25,
    averageUtilization: 23,
    peakUtilization: 45,
    idleTime: 18,
    cost: 150
  }
];

const optimizationResult = await resourceOptimizer.analyzeAndOptimize(resources);

console.log(`Generated ${optimizationResult.recommendations.length} recommendations`);
console.log('Potential savings:');
console.log(`  Energy: ${optimizationResult.totalPotentialSavings.energy.toFixed(2)} kWh`);
console.log(`  Cost: $${optimizationResult.totalPotentialSavings.cost.toFixed(2)}`);
console.log(`  Carbon: ${optimizationResult.totalPotentialSavings.carbon.toFixed(2)} kg CO2e`);

// Implementation roadmap
optimizationResult.implementationRoadmap.forEach(phase => {
  console.log(`\n${phase.phase}:`);
  phase.recommendations.forEach(rec => console.log(`  - ${rec}`));
});
```

### EfficiencyAnalyzer

Analyzes operational efficiency and benchmarks against industry standards.

```typescript
// Analyze efficiency
const analysis = await efficiencyAnalyzer.analyzeEfficiency(energyMetrics);

console.log(`Overall efficiency: ${analysis.metrics.overallEfficiency.toFixed(1)}%`);
console.log(`PUE: ${analysis.metrics.pue.toFixed(2)}`);
console.log(`CUE: ${analysis.metrics.cue.toFixed(2)}`);

// Check benchmarks
analysis.benchmarks.forEach(benchmark => {
  console.log(`\n${benchmark.metric}:`);
  console.log(`  Current: ${benchmark.currentValue.toFixed(2)}`);
  console.log(`  Industry Average: ${benchmark.industryAverage.toFixed(2)}`);
  console.log(`  Best in Class: ${benchmark.bestInClass.toFixed(2)}`);
  console.log(`  Status: ${benchmark.status}`);
});

// Review alerts
analysis.alerts.forEach(alert => {
  console.log(`[${alert.severity}] ${alert.message}`);
});
```

### SustainabilityReporter

Generates comprehensive sustainability reports with goal tracking.

```typescript
// Generate sustainability report
const report = await sustainabilityReporter.generateReport(
  energyUsage,
  carbonFootprint,
  efficiencyMetrics,
  startDate,
  endDate
);

console.log(`\nSustainability Report (${report.reportId})`);
console.log(`Period: ${report.period.start} to ${report.period.end}`);
console.log('\nSummary:');
console.log(`  Total Energy: ${report.summary.totalEnergyConsumption.toFixed(2)} kWh`);
console.log(`  Total Emissions: ${report.summary.totalCarbonEmissions.toFixed(2)} kg CO2e`);
console.log(`  Renewable Energy: ${report.summary.renewableEnergyPercentage.toFixed(1)}%`);
console.log(`  Cost Savings: $${report.summary.costSavings.toFixed(2)}`);

console.log('\nGoals:');
report.goals.forEach(goal => {
  console.log(`  ${goal.name}: ${goal.progress.toFixed(1)}% (${goal.status})`);
});

console.log('\nAchievements:');
report.achievements.forEach(achievement => {
  console.log(`  ✓ ${achievement}`);
});
```

### GreenAIAdvisor

Provides recommendations for sustainable AI/ML operations.

```typescript
// Analyze AI model
const modelMetrics: GreenAIMetrics = {
  modelId: 'model-123',
  modelName: 'GPT-Large',
  trainingEnergy: 150, // kWh
  trainingCarbon: 75, // kg CO2e
  inferenceEnergy: 12, // kWh per 1000 requests
  inferenceCarbon: 6, // kg CO2e per 1000 requests
  efficiency: 0.8,
  parameters: 1.5e9,
  flops: 1e15
};

const recommendations = await greenAIAdvisor.analyzeModel(modelMetrics);

console.log(`\nGreen AI Recommendations for ${modelMetrics.modelName}:`);
recommendations.forEach(rec => {
  console.log(`\n[${rec.priority}] ${rec.title}`);
  console.log(`Type: ${rec.type}`);
  console.log(`Impact: ${rec.impact.energyReduction}% energy, ${rec.impact.carbonReduction}% carbon`);
  console.log(`Difficulty: ${rec.implementation.difficulty}`);
  console.log(`Steps:`);
  rec.implementation.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
});

// Calculate efficiency score
const score = greenAIAdvisor.calculateEfficiencyScore(modelMetrics);
console.log(`\nModel Efficiency Score: ${score.toFixed(1)}/100`);
```

## Configuration

The module supports flexible configuration through the `EcoOptimizerConfig` interface:

```typescript
const config: EcoOptimizerConfig = {
  cloudProviders: [
    {
      provider: CloudProvider.AWS,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      regions: ['us-east-1', 'us-west-2', 'eu-west-1']
    }
  ],
  monitoring: {
    interval: 5, // minutes
    enableRealTime: true,
    retentionDays: 90
  },
  optimization: {
    enableAutoOptimization: false,
    optimizationThreshold: 50,
    approvalRequired: true
  },
  reporting: {
    schedule: 'WEEKLY',
    recipients: ['team@example.com'],
    format: 'PDF'
  },
  goals: {
    carbonNeutralityDate: new Date('2030-12-31'),
    renewableEnergyTarget: 80, // percentage
    efficiencyTarget: 30, // percentage improvement
    costReductionTarget: 25 // percentage
  }
};
```

## Best Practices

### 1. Regular Monitoring

Enable continuous monitoring to catch efficiency issues early:

```typescript
energyMonitor.startMonitoring(5); // Check every 5 minutes
```

### 2. Set Realistic Goals

Define achievable sustainability goals based on current metrics:

```typescript
const carbonGoal: SustainabilityGoal = {
  id: 'carbon-reduction',
  name: 'Reduce Carbon Emissions',
  target: 30, // 30% reduction
  current: 0,
  unit: '%',
  deadline: new Date('2025-12-31'),
  progress: 0,
  status: 'ON_TRACK'
};

sustainabilityReporter.addGoal(carbonGoal);
```

### 3. Implement Recommendations Gradually

Follow the implementation roadmap provided by ResourceOptimizer:

```typescript
// Start with quick wins
const quickWins = optimizationResult.implementationRoadmap[0];
console.log(`Phase 1: ${quickWins.phase}`);
// Implement these first before moving to complex changes
```

### 4. Track Progress

Monitor efficiency improvements over time:

```typescript
const current = await efficiencyAnalyzer.calculateEfficiencyMetrics(currentMetrics);
const comparison = efficiencyAnalyzer.compareEfficiency(current, baseline);

if (comparison.improved) {
  console.log(`Efficiency improved by ${comparison.change.toFixed(1)}%`);
}
```

## API Reference

See the [TypeScript definitions](./src/types/index.ts) for complete API documentation.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [https://github.com/neonhub/eco-optimizer/issues](https://github.com/neonhub/eco-optimizer/issues)
- Documentation: [https://docs.neonhub.io/eco-optimizer](https://docs.neonhub.io/eco-optimizer)

---

Built with ❤️ for a sustainable future 🌱