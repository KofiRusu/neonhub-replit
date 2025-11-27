"use client"

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp } from 'lucide-react';
import PageLayout from '@/components/page-layout';
import { SEODashboard } from '@/components/seo/SEODashboard';
import { TrendingTopics } from '@/components/seo/TrendingTopics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neonhubecosystem.com';

export default function SEODashboardPage() {
  const actions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-neon text-sm flex items-center space-x-2"
      >
        <TrendingUp className="w-4 h-4" />
        <span>View Insights</span>
      </motion.button>
    </div>
  );

  return (
    <PageLayout
      title="SEO Control Centre"
      subtitle="Monitor performance, discover opportunities, and orchestrate optimisations from a single dashboard"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Quick Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {['Performance', 'Keywords', 'Content', 'Trends'].map((stat, index) => (
            <motion.div
              key={stat}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700/50 p-4 rounded-xl backdrop-blur-sm"
            >
              <p className="text-sm text-gray-400 mb-1">{stat}</p>
              <p className="text-2xl font-bold text-neon-blue">—</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Loading dashboard…</CardTitle>
                </CardHeader>
                <CardContent>Just a moment while we prepare the latest metrics.</CardContent>
              </Card>
            }
          >
            <SEODashboard organizationId={organizationId} siteUrl={siteUrl} />
          </Suspense>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <TrendingTopics niche="marketing automation" />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-slate-700/60 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Workflow checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start space-x-2 hover:text-gray-300 transition-colors">
                  <span className="text-neon-blue">•</span>
                  <p>Review new keyword clusters and assign briefs.</p>
                </div>
                <div className="flex items-start space-x-2 hover:text-gray-300 transition-colors">
                  <span className="text-neon-purple">•</span>
                  <p>Generate drafts for high-opportunity keywords and route for approval.</p>
                </div>
                <div className="flex items-start space-x-2 hover:text-gray-300 transition-colors">
                  <span className="text-neon-green">•</span>
                  <p>Run internal link pass on recently published content.</p>
                </div>
                <div className="flex items-start space-x-2 hover:text-gray-300 transition-colors">
                  <span className="text-neon-pink">•</span>
                  <p>Monitor impressions/clicks and adjust metadata for underperforming content.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
