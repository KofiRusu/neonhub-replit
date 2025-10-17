import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react';

interface QAMetrics {
  testCoverage: number;
  testPassRate: number;
  performanceScore: number;
  anomalyCount: number;
  selfHealingTriggered: number;
  lastUpdated: Date;
}

interface AnomalyData {
  id: string;
  type: 'performance' | 'error' | 'resource' | 'behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface BenchmarkData {
  buildId: string;
  baselineVersion: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  performanceDelta: number;
  timestamp: Date;
}

export const QAMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<QAMetrics>({
    testCoverage: 0,
    testPassRate: 0,
    performanceScore: 0,
    anomalyCount: 0,
    selfHealingTriggered: 0,
    lastUpdated: new Date()
  });

  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchQAMetrics();
    fetchAnomalies();
    fetchBenchmarks();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchQAMetrics();
      fetchAnomalies();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchQAMetrics = async () => {
    try {
      // In a real implementation, this would fetch from the QA Sentinel API
      const response = await fetch('/api/qa/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Mock data for demonstration
        setMetrics({
          testCoverage: 87.5,
          testPassRate: 94.2,
          performanceScore: 92.1,
          anomalyCount: 3,
          selfHealingTriggered: 2,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to fetch QA metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('/api/qa/anomalies');
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data);
      } else {
        // Mock anomalies for demonstration
        setAnomalies([
          {
            id: '1',
            type: 'performance',
            severity: 'medium',
            component: 'api',
            message: 'Response time increased by 15%',
            timestamp: new Date(Date.now() - 300000),
            resolved: false
          },
          {
            id: '2',
            type: 'error',
            severity: 'high',
            component: 'database',
            message: 'Connection pool exhausted',
            timestamp: new Date(Date.now() - 600000),
            resolved: true
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const response = await fetch('/api/qa/benchmarks');
      if (response.ok) {
        const data = await response.json();
        setBenchmarks(data);
      } else {
        // Mock benchmark data
        setBenchmarks([
          {
            buildId: 'build-123',
            baselineVersion: 'v5.0',
            responseTime: 145,
            throughput: 98,
            errorRate: 0.015,
            performanceDelta: -2.1,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch benchmarks:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (value: number, threshold: number) => {
    if (value >= threshold) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (value >= threshold * 0.8) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QA Sentinel Monitor</h1>
          <p className="text-muted-foreground">
            Autonomous QA & Regression Sentinel Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Active</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            {getStatusIcon(metrics.testCoverage, 80)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.testCoverage}%</div>
            <Progress value={metrics.testCoverage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: 80%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            {getStatusIcon(metrics.testPassRate, 95)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.testPassRate}%</div>
            <Progress value={metrics.testPassRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            {getStatusIcon(metrics.performanceScore, 85)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performanceScore}</div>
            <Progress value={metrics.performanceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Score out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.anomalyCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.anomalyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.selfHealingTriggered} auto-healed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Health</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Agents</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Degraded
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ML Models</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm">ML test generation completed</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm">Performance anomaly detected</p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm">Self-healing action completed</p>
                      <p className="text-xs text-muted-foreground">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <p className="text-muted-foreground">No anomalies detected</p>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anomaly) => (
                    <Alert key={anomaly.id} className={anomaly.resolved ? 'border-green-200 bg-green-50' : ''}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(anomaly.severity)}>
                                {anomaly.severity}
                              </Badge>
                              <Badge variant="outline">{anomaly.type}</Badge>
                              <span className="font-medium">{anomaly.component}</span>
                            </div>
                            <p className="mt-1">{anomaly.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {anomaly.timestamp.toLocaleString()}
                              {anomaly.resolved && ' • Resolved'}
                            </p>
                          </div>
                          {!anomaly.resolved && (
                            <Button variant="outline" size="sm">
                              Investigate
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Benchmarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {benchmarks.length === 0 ? (
                <p className="text-muted-foreground">No benchmark data available</p>
              ) : (
                <div className="space-y-4">
                  {benchmarks.map((benchmark) => (
                    <div key={benchmark.buildId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Build {benchmark.buildId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Baseline: {benchmark.baselineVersion}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {benchmark.performanceDelta < 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            benchmark.performanceDelta < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {benchmark.performanceDelta > 0 ? '+' : ''}{benchmark.performanceDelta.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Response Time</p>
                          <p className="font-medium">{benchmark.responseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Throughput</p>
                          <p className="font-medium">{benchmark.throughput} req/s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Error Rate</p>
                          <p className="font-medium">{(benchmark.errorRate * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">Trend charts will be displayed here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Integration with charting library needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center">
        Last updated: {metrics.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};