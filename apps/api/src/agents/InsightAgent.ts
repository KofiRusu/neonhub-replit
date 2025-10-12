/**
 * Insight Agent - Data Analysis & Business Intelligence
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key-for-testing',
});

export interface DataInsight {
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

export class InsightAgent {
  /**
   * Analyze marketing data and generate insights
   */
  async analyzeData(data: {
    metrics: Array<{ name: string; value: number; previousValue?: number }>;
    timeframe: string;
  }): Promise<DataInsight[]> {
    const insights: DataInsight[] = [];

    // Analyze each metric
    for (const metric of data.metrics) {
      if (metric.previousValue) {
        const change = ((metric.value - metric.previousValue) / metric.previousValue) * 100;

        if (Math.abs(change) > 20) {
          insights.push({
            type: change > 0 ? 'trend' : 'anomaly',
            title: `${metric.name} ${change > 0 ? 'Surge' : 'Drop'}`,
            description: `${metric.name} has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in the ${data.timeframe}`,
            confidence: 0.85,
            impact: Math.abs(change) > 50 ? 'high' : 'medium',
            actionable: true,
            suggestedActions: [
              change > 0
                ? `Investigate what's driving the ${metric.name} increase`
                : `Review factors contributing to the ${metric.name} decline`,
              'Update forecasts based on new trend',
              'Adjust marketing budget allocation if needed',
            ],
          });
        }
      }
    }

    // Add AI-generated insights
    try {
      const aiInsights = await this.generateAIInsights(data);
      insights.push(...aiInsights);
    } catch (error) {
      console.error('AI insight generation error:', error);
    }

    return insights;
  }

  /**
   * Generate AI-powered insights
   */
  private async generateAIInsights(data: any): Promise<DataInsight[]> {
    const prompt = `Analyze this marketing data and provide 2-3 actionable insights:
${JSON.stringify(data, null, 2)}

Format as JSON array: [{ "title": "...", "description": "...", "actions": ["...", "..."] }]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      const parsed = JSON.parse(content);

      return parsed.map((insight: any) => ({
        type: 'recommendation' as const,
        title: insight.title,
        description: insight.description,
        confidence: 0.75,
        impact: 'medium' as const,
        actionable: true,
        suggestedActions: insight.actions || [],
      }));
    } catch {
      return [];
    }
  }

  /**
   * Predict future trends
   */
  async predictTrends(
    historicalData: Array<{ date: string; value: number }>
  ): Promise<{ predictions: Array<{ date: string; value: number }>; confidence: number }> {
    // Simple linear regression for prediction
    const n = historicalData.length;
    if (n < 3) {
      return { predictions: [], confidence: 0 };
    }

    const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + d.value, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumX2 = historicalData.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 7 days
    const predictions = [];
    const lastDate = new Date(historicalData[n - 1].date);

    for (let i = 1; i <= 7; i++) {
      const predictedValue = slope * (n + i) + intercept;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);

      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        value: Math.max(0, Math.round(predictedValue)),
      });
    }

    return { predictions, confidence: 0.7 };
  }

  /**
   * Get sample insights
   */
  getSampleInsights(): DataInsight[] {
    return [
      {
        type: 'trend',
        title: 'Rising Engagement Rate',
        description: 'Social media engagement has increased by 35% this week',
        confidence: 0.9,
        impact: 'high',
        actionable: true,
        suggestedActions: [
          'Analyze top-performing content',
          'Increase posting frequency',
          'Allocate more budget to social campaigns',
        ],
      },
      {
        type: 'anomaly',
        title: 'Email Click Rate Drop',
        description: 'Email click-through rate declined by 22% compared to last month',
        confidence: 0.85,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Review email subject lines and content',
          'Segment audience for better targeting',
          'A/B test different CTAs',
        ],
      },
    ];
  }
}

export const insightAgent = new InsightAgent();

