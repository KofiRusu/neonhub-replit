'use client';

import { useState } from 'react';
import { useExecutiveSummary, useBrandVoiceKpis, useCampaigns } from '@/hooks/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TrendingUp, TrendingDown, BarChart3, PieChart, Download, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: campaigns } = useCampaigns();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useExecutiveSummary(notes);
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useBrandVoiceKpis();

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      await refetchSummary();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchKpis();
  };

  if (summaryLoading || kpisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Deep insights into your marketing performance</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="brand-voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +4.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  -0.8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">285%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +22% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Campaign performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Chart visualization will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Detailed metrics for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">{campaign.type} • {campaign.status}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Engagement</p>
                          <p className="text-lg font-bold">18.5%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Conversions</p>
                          <p className="text-lg font-bold">142</p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No campaigns to analyze</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand-voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice Analytics</CardTitle>
              <CardDescription>AI analysis of your brand voice consistency and effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              {kpis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <p className="text-sm text-gray-600">Voice Consistency</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">4.6/5</div>
                      <p className="text-sm text-gray-600">Audience Resonance</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">87%</div>
                      <p className="text-sm text-gray-600">Brand Alignment</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Professional</Badge>
                        <span className="text-sm">Your tone is consistently professional across all channels</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Engaging</Badge>
                        <span className="text-sm">Content shows high engagement rates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Authentic</Badge>
                        <span className="text-sm">Brand voice feels authentic to your audience</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading brand voice analytics...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Get personalized recommendations and strategic insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Add Context (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any specific context or questions you'd like the AI to consider..."
                  className="min-h-[100px]"
                />
              </div>
              
              <Button onClick={handleGenerateSummary} disabled={isGenerating}>
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Insights
              </Button>

              {summary && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Executive Summary</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">{JSON.stringify(summary)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Strategic Recommendations</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm">Focus on scaling your top-performing email campaigns</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm">Optimize posting times for social media to increase engagement</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm">Consider A/B testing subject lines to improve open rates</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}