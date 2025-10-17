'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, Zap, Target, Clock, Users } from 'lucide-react';

interface RealTimeRecommendation {
  id: string;
  type: 'performance' | 'engagement' | 'conversion' | 'retention';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
  confidence: number;
  data: {
    currentValue: number;
    targetValue: number;
    trend: 'improving' | 'declining' | 'stable';
    timeframe: string;
  };
  timestamp: string;
}

interface RealTimeRecommendationsProps {
  userId?: string;
  context?: 'dashboard' | 'campaign' | 'analytics';
  className?: string;
}

export function RealTimeRecommendations({
  userId,
  context = 'dashboard',
  className
}: RealTimeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RealTimeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchRecommendations();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRecommendations, 30000);
    return () => clearInterval(interval);
  }, [userId, context]);

  const fetchRecommendations = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (context) params.append('context', context);

      const response = await fetch(`/api/personalization/realtime?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch real-time recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'engagement': return <Users className="h-4 w-4" />;
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'retention': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'text-yellow-600 bg-yellow-100';
      case 'engagement': return 'text-blue-600 bg-blue-100';
      case 'conversion': return 'text-green-600 bg-green-100';
      case 'retention': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 rounded-full bg-gray-400" />;
      default: return null;
    }
  };

  const formatValue = (value: number, type: string) => {
    if (type.includes('rate') || type.includes('percentage')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (type.includes('time') || type.includes('duration')) {
      return `${value.toFixed(0)}s`;
    }
    return value.toFixed(1);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-pulse text-gray-500">Loading recommendations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Real-Time Recommendations
          </CardTitle>
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <p className="text-blue-800">
                No real-time recommendations available. We'll analyze your data and provide insights soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <Card key={rec.id} className={`border-l-4 ${getPriorityColor(rec.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getTypeColor(rec.type)}`}>
                        {getTypeIcon(rec.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rec.type}
                          </Badge>
                          <Badge
                            variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority} priority
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getTrendIcon(rec.data.trend)}
                            <span>{rec.data.trend}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {Math.round(rec.confidence * 100)}% confidence
                      </div>
                      <div className="text-xs text-gray-500">
                        {rec.data.timeframe}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>

                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Current:</span>
                        <span className="font-medium ml-1">
                          {formatValue(rec.data.currentValue, rec.type)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <span className="font-medium ml-1 text-green-600">
                          {formatValue(rec.data.targetValue, rec.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500">Expected impact:</span>
                      <span className="font-medium ml-1 text-green-600">
                        {rec.expectedImpact}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      {rec.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Recommendations update every 30 seconds based on real-time performance data
        </div>
      </CardContent>
    </Card>
  );
}