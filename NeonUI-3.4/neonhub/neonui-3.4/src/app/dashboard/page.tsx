'use client';

import { useCurrentUser, useCampaigns, useExecutiveSummary } from '@/hooks/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: campaigns, isLoading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useExecutiveSummary();

  if (userLoading || campaignsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600">Loading dashboard...</p>
          <span className="sr-only">Loading dashboard data</span>
        </div>
      </div>
    );
  }

  if (userError || campaignsError || summaryError) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="alert" aria-live="assertive">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">Please try refreshing page or contact support.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Refresh page to retry loading dashboard"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  const draftCampaigns = campaigns?.filter(c => c.status === 'draft') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || user?.email}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your marketing campaigns.</p>
      </header>

      {/* Stats Cards */}
      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">Campaign Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`Total campaigns: ${campaigns?.length || 0}`}>
                {campaigns?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{activeCampaigns.length} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`Active campaigns: ${activeCampaigns.length}`}>
                {activeCampaigns.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {draftCampaigns.length} in draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label="Engagement rate: 12.5 percent">
                12.5%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label="Return on investment: 245 percent">
                245%
              </div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-labelledby="recent-campaigns-heading">
          <Card>
            <CardHeader>
              <CardTitle id="recent-campaigns-heading">Recent Campaigns</CardTitle>
              <CardDescription>Your latest marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4" role="list">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between" role="listitem">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{campaign.type}</p>
                      </div>
                      <Badge
                        variant={campaign.status === 'active' ? 'default' : 'secondary'}
                        aria-label={`Campaign status: ${campaign.status}`}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
              )}
              <Button
                className="w-full mt-4"
                variant="outline"
                aria-label="View all campaigns"
              >
                View All Campaigns
              </Button>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="executive-summary-heading">
          <Card>
            <CardHeader>
              <CardTitle id="executive-summary-heading">Executive Summary</CardTitle>
              <CardDescription>AI-powered insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <p className="text-sm text-gray-600">
                      Your campaigns are performing well above industry averages.
                      Focus on scaling your most successful campaigns.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="text-sm text-gray-600 space-y-1" role="list">
                      <li role="listitem">Increase budget for top-performing campaigns</li>
                      <li role="listitem">A/B test email subject lines</li>
                      <li role="listitem">Optimize posting times for social media</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading insights...</p>
              )}
              <Button
                className="w-full mt-4"
                variant="outline"
                aria-label="View full analytics dashboard"
              >
                View Full Analytics
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}