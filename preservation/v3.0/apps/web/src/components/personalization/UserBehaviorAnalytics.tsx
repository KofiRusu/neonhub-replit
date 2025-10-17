'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Clock, Target, RefreshCw } from 'lucide-react';

interface UserBehaviorData {
  userId: string;
  sessionDuration: number;
  pageViews: number;
  actions: string[];
  conversionEvents: string[];
  deviceType: string;
  location: string;
  timestamp: string;
}

interface Recommendation {
  id: string;
  type: 'content' | 'feature' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface UserBehaviorAnalyticsProps {
  userId?: string;
  className?: string;
}

export function UserBehaviorAnalytics({ userId, className }: UserBehaviorAnalyticsProps) {
  const [behaviorData, setBehaviorData] = useState<UserBehaviorData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserBehaviorData();
    fetchRecommendations();
  }, [userId]);

  const fetchUserBehaviorData = async () => {
    try {
      const response = await fetch(`/api/analytics/user-behavior${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setBehaviorData(data.behaviors || []);
      }
    } catch (error) {
      console.error('Failed to fetch user behavior data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/personalization/recommendations${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Behavior Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="behavior">Behavior Patterns</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Avg Session Duration</p>
                      <p className="text-2xl font-bold">
                        {behaviorData.length > 0
                          ? Math.round(behaviorData.reduce((acc, b) => acc + b.sessionDuration, 0) / behaviorData.length)
                          : 0}s
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Total Page Views</p>
                      <p className="text-2xl font-bold">
                        {behaviorData.reduce((acc, b) => acc + b.pageViews, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold">
                        {behaviorData.length > 0
                          ? Math.round((behaviorData.reduce((acc, b) => acc + b.conversionEvents.length, 0) / behaviorData.length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <div className="space-y-4">
              {behaviorData.slice(0, 10).map((behavior, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Session {index + 1}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(behavior.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{behavior.deviceType}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{behavior.sessionDuration}s</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Page Views</p>
                        <p className="font-medium">{behavior.pageViews}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Actions</p>
                        <p className="font-medium">{behavior.actions.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conversions</p>
                        <p className="font-medium">{behavior.conversionEvents.length}</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Recent Actions:</p>
                      <div className="flex flex-wrap gap-1">
                        {behavior.actions.slice(0, 5).map((action, actionIndex) => (
                          <Badge key={actionIndex} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{rec.type}</Badge>
                        </div>
                        <h3 className="font-medium">{rec.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                          {Math.round(rec.confidence * 100)}% confidence
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <Button size="sm" variant="outline">
                        Implement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {recommendations.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recommendations available yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Recommendations will appear as we learn more about user behavior patterns.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}