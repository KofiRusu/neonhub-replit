"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Search, ExternalLink, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, Link2, FileText, Target, BarChart3, Globe, Calendar, Filter, Download, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import PageLayout from "@/components/page-layout"
import Link from "next/link"

// Mock data for SEO metrics
const keywordData = [
  { keyword: "AI marketing automation", position: 3, change: 2, volume: 12000, difficulty: 72, url: "/features" },
  { keyword: "marketing automation platform", position: 7, change: -1, volume: 8500, difficulty: 68, url: "/" },
  { keyword: "AI content generation", position: 12, change: 5, volume: 15000, difficulty: 75, url: "/content" },
  { keyword: "email marketing AI", position: 5, change: 0, volume: 9200, difficulty: 64, url: "/email" },
  { keyword: "social media automation", position: 15, change: -3, volume: 11000, difficulty: 70, url: "/social" },
  { keyword: "brand voice consistency", position: 8, change: 4, volume: 3400, difficulty: 58, url: "/brand-voice" },
  { keyword: "campaign orchestration", position: 21, change: 8, volume: 2100, difficulty: 52, url: "/campaigns" },
  { keyword: "AI marketing analytics", position: 9, change: 1, volume: 7800, difficulty: 66, url: "/analytics" },
]

const topPages = [
  { url: "/", visits: 45200, ctr: 4.2, avgPosition: 8.5, impressions: 1075000 },
  { url: "/features", visits: 32100, ctr: 5.1, avgPosition: 5.2, impressions: 629412 },
  { url: "/pricing", visits: 28400, ctr: 3.8, avgPosition: 11.3, impressions: 747368 },
  { url: "/content", visits: 19800, ctr: 4.7, avgPosition: 7.8, impressions: 421277 },
  { url: "/blog", visits: 15600, ctr: 2.9, avgPosition: 15.2, impressions: 537931 },
]

const backlinks = [
  { domain: "techcrunch.com", authority: 92, links: 12, traffic: 8500, status: "active" },
  { domain: "forbes.com", authority: 95, links: 8, traffic: 12000, status: "active" },
  { domain: "marketingweek.com", authority: 78, links: 23, traffic: 3200, status: "active" },
  { domain: "adage.com", authority: 82, links: 15, traffic: 4100, status: "active" },
  { domain: "blog.hubspot.com", authority: 88, links: 6, traffic: 6700, status: "active" },
]

const contentGaps = [
  { keyword: "AI agent workflows", volume: 18000, difficulty: 62, opportunity: 95 },
  { keyword: "marketing automation ROI", volume: 9500, difficulty: 58, opportunity: 88 },
  { keyword: "multi-channel campaigns", volume: 7200, difficulty: 54, opportunity: 82 },
  { keyword: "personalized email AI", volume: 11000, difficulty: 68, opportunity: 78 },
]

export default function SEOPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedTab, setSelectedTab] = useState("overview")

  return (
    <PageLayout
      title="SEO Optimizer"
      description="Track rankings, analyze performance, and optimize your search presence"
      actions={
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 glass-strong border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/seo/strategy">
            <Button variant="outline" size="sm" className="space-x-2 glass-strong border-white/10">
              <Target className="h-4 w-4" />
              <span>Strategy Builder</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button size="sm" className="bg-neon-blue hover:bg-neon-blue/80 space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      }
    >
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Organic Traffic</CardTitle>
              <Eye className="h-4 w-4 text-neon-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">142,847</div>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-neon-green mr-1" />
                <span className="text-sm text-neon-green font-medium">+18.2%</span>
                <span className="text-xs text-gray-400 ml-2">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Avg. Position</CardTitle>
              <Target className="h-4 w-4 text-neon-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8.4</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-neon-green mr-1" />
                <span className="text-sm text-neon-green font-medium">+2.1 positions</span>
                <span className="text-xs text-gray-400 ml-2">improved</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Keywords</CardTitle>
              <Search className="h-4 w-4 text-neon-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,247</div>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-neon-green mr-1" />
                <span className="text-sm text-neon-green font-medium">+94</span>
                <span className="text-xs text-gray-400 ml-2">new rankings</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-strong border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Domain Authority</CardTitle>
              <BarChart3 className="h-4 w-4 text-neon-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">72/100</div>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-neon-green mr-1" />
                <span className="text-sm text-neon-green font-medium">+3 points</span>
                <span className="text-xs text-gray-400 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="glass-strong border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search Performance Chart */}
            <Card className="glass-strong border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Search Performance</CardTitle>
                <CardDescription>Clicks and impressions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[45, 52, 48, 61, 58, 69, 73, 68, 75, 71, 82, 79, 88, 85].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end space-y-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${value}%` }}
                        transition={{ delay: i * 0.05 }}
                        className="w-full bg-gradient-to-t from-neon-blue/50 to-neon-blue rounded-t-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-400">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Pages */}
            <Card className="glass-strong border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Pages</CardTitle>
                <CardDescription>Pages driving the most traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-2 glass rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-neon-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{page.url}</p>
                          <p className="text-xs text-gray-400">{page.visits.toLocaleString()} visits</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-neon-blue/30 text-neon-blue">
                        {page.ctr}% CTR
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO Health Score */}
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white">SEO Health Score</CardTitle>
              <CardDescription>Overall site optimization status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Technical SEO</span>
                    <span className="text-sm font-medium text-neon-green">92%</span>
                  </div>
                  <Progress value={92} className="h-2 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full" />
                  </Progress>
                  <div className="flex items-center text-xs text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-neon-green mr-1" />
                    <span>23/25 checks passed</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Content Quality</span>
                    <span className="text-sm font-medium text-neon-blue">85%</span>
                  </div>
                  <Progress value={85} className="h-2 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full" />
                  </Progress>
                  <div className="flex items-center text-xs text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-neon-blue mr-1" />
                    <span>Good optimization</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Link Profile</span>
                    <span className="text-sm font-medium text-neon-purple">78%</span>
                  </div>
                  <Progress value={78} className="h-2 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full" />
                  </Progress>
                  <div className="flex items-center text-xs text-gray-400">
                    <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                    <span>Room for improvement</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Keyword Rankings</CardTitle>
              <CardDescription>Track your keyword positions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {keywordData.map((keyword, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 glass rounded-lg hover:glass-hover transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-neon-blue/20 border border-neon-blue/30">
                        <span className="text-lg font-bold text-neon-blue">{keyword.position}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white">{keyword.keyword}</p>
                          {keyword.change !== 0 && (
                            <Badge
                              variant="outline"
                              className={
                                keyword.change > 0
                                  ? "border-neon-green/30 text-neon-green"
                                  : "border-red-500/30 text-red-400"
                              }
                            >
                              {keyword.change > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(keyword.change)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">
                            <Search className="h-3 w-3 inline mr-1" />
                            {keyword.volume.toLocaleString()}/mo
                          </span>
                          <span className="text-xs text-gray-400">Difficulty: {keyword.difficulty}</span>
                          <a href={keyword.url} className="text-xs text-neon-blue hover:underline flex items-center">
                            {keyword.url}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Page Performance</CardTitle>
              <CardDescription>Analyze individual page metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPages.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 glass rounded-lg hover:glass-hover transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-neon-purple" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{page.url}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">
                            <Eye className="h-3 w-3 inline mr-1" />
                            {page.visits.toLocaleString()} visits
                          </span>
                          <span className="text-xs text-gray-400">
                            <MousePointerClick className="h-3 w-3 inline mr-1" />
                            {page.ctr}% CTR
                          </span>
                          <span className="text-xs text-gray-400">Position: {page.avgPosition}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{page.impressions.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">impressions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backlinks Tab */}
        <TabsContent value="backlinks" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Backlink Profile</CardTitle>
              <CardDescription>Monitor your inbound links and domain authority</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {backlinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 glass rounded-lg hover:glass-hover transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-neon-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{link.domain}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">DA: {link.authority}</span>
                          <span className="text-xs text-gray-400">{link.links} links</span>
                          <span className="text-xs text-gray-400">{link.traffic.toLocaleString()} referrals</span>
                          <Badge variant="outline" className="border-neon-green/30 text-neon-green text-xs">
                            {link.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Content Opportunities</CardTitle>
              <CardDescription>High-potential keywords you're not ranking for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contentGaps.map((gap, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 glass rounded-lg hover:glass-hover transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center">
                        <Target className="h-6 w-6 text-neon-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{gap.keyword}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">
                            <Search className="h-3 w-3 inline mr-1" />
                            {gap.volume.toLocaleString()}/mo
                          </span>
                          <span className="text-xs text-gray-400">Difficulty: {gap.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-green">{gap.opportunity}%</div>
                        <div className="text-xs text-gray-400">opportunity</div>
                      </div>
                      <Button size="sm" className="bg-neon-blue hover:bg-neon-blue/80">
                        Create Content
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-white/10 border-neon-blue/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertCircle className="h-5 w-5 text-neon-blue mr-2" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Actionable insights to improve your SEO performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 glass rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-neon-green mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Optimize meta descriptions for top 10 pages
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Pages with optimized meta descriptions have 15% higher CTR
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 glass rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-neon-blue mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Target long-tail keywords for quick wins</p>
                      <p className="text-xs text-gray-400 mt-1">
                        47 low-competition keywords identified with high conversion potential
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 glass rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-neon-purple mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Build backlinks from tech publications</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Competitors have 3x more backlinks from high-authority tech sites
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}

