"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Plus,
  Search,
  TrendingUp,
  Heart,
  MessageCircle,
  Share,
  BarChart3,
  Calendar,
  Sparkles,
  Clock,
  Target,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageLayout from "@/components/page-layout"

const platforms = [
  {
    name: "Twitter",
    icon: Twitter,
    color: "text-blue-400",
    followers: "12.5K",
    engagement: "4.2%",
    posts: 156,
    growth: "+12%",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-600",
    followers: "8.3K",
    engagement: "6.8%",
    posts: 89,
    growth: "+18%",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    followers: "25.1K",
    engagement: "3.9%",
    posts: 234,
    growth: "+8%",
  },
  {
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    followers: "15.7K",
    engagement: "2.1%",
    posts: 67,
    growth: "+5%",
  },
]

const recentPosts = [
  {
    id: 1,
    platform: "Twitter",
    content: "Just launched our new AI-powered analytics dashboard! 🚀 #AI #Analytics",
    timestamp: "2 hours ago",
    likes: 45,
    comments: 12,
    shares: 8,
    engagement: "High",
    status: "Published",
  },
  {
    id: 2,
    platform: "LinkedIn",
    content: "Excited to share insights from our latest marketing automation study...",
    timestamp: "5 hours ago",
    likes: 89,
    comments: 23,
    shares: 15,
    engagement: "Very High",
    status: "Published",
  },
  {
    id: 3,
    platform: "Instagram",
    content: "Behind the scenes at NeonHub HQ ✨ #TeamWork #Innovation",
    timestamp: "1 day ago",
    likes: 234,
    comments: 45,
    shares: 67,
    engagement: "Excellent",
    status: "Published",
  },
  {
    id: 4,
    platform: "Facebook",
    content: "Join us for our upcoming webinar on digital marketing trends...",
    timestamp: "2 days ago",
    likes: 56,
    comments: 18,
    shares: 12,
    engagement: "Good",
    status: "Scheduled",
  },
]

const aiSuggestions = [
  {
    type: "Trending Topic",
    content: "AI automation is trending - consider sharing your expertise",
    potential: "High",
    icon: TrendingUp,
  },
  {
    type: "Optimal Time",
    content: "Best posting time for your audience: 2-4 PM EST",
    potential: "Medium",
    icon: Clock,
  },
  {
    type: "Content Gap",
    content: "Your audience engages well with tutorial content",
    potential: "High",
    icon: Target,
  },
  {
    type: "Engagement Boost",
    content: "Add more visual content to increase engagement by 40%",
    potential: "Very High",
    icon: Zap,
  },
]

const upcomingPosts = [
  {
    platform: "Twitter",
    content: "New feature announcement coming tomorrow! 🎉",
    scheduledTime: "Today, 3:00 PM",
    status: "Scheduled",
  },
  {
    platform: "LinkedIn",
    content: "Weekly industry insights and trends analysis...",
    scheduledTime: "Tomorrow, 9:00 AM",
    status: "Draft",
  },
  {
    platform: "Instagram",
    content: "Product showcase with stunning visuals ✨",
    scheduledTime: "Tomorrow, 6:00 PM",
    status: "Scheduled",
  },
]

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredPosts = recentPosts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = selectedPlatform === "all" || post.platform.toLowerCase() === selectedPlatform
    return matchesSearch && matchesPlatform
  })

  return (
    <PageLayout title="Social Media Agent" subtitle="Manage your social media presence with AI-powered insights">
      <div className="space-y-8">
        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-neon-blue transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <platform.icon className={`w-8 h-8 ${platform.color}`} />
                    <Badge variant="outline" className="text-neon-green">
                      {platform.growth}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Followers:</span>
                      <span className="text-white font-medium">{platform.followers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement:</span>
                      <span className="text-neon-blue font-medium">{platform.engagement}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posts:</span>
                      <span className="text-white font-medium">{platform.posts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-neon-blue" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Reach</span>
                      <span className="text-neon-green font-bold">2.4M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Engagement Rate</span>
                      <span className="text-neon-blue font-bold">4.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Followers</span>
                      <span className="text-neon-purple font-bold">+1,234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Posts This Week</span>
                      <span className="text-white font-bold">28</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Post */}
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-neon-green" />
                    Top Performing Post
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      &quot;Just launched our new AI-powered analytics dashboard! 🚀 #AI #Analytics&quot;
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>234</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span>45</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share className="w-4 h-4 text-green-400" />
                        <span>67</span>
                      </div>
                    </div>
                    <Badge className="bg-neon-green/20 text-neon-green">Excellent Performance</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-white/20"
                />
              </div>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-full sm:w-48 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-white/20">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-neon">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-white/20">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="What's on your mind?"
                      className="min-h-32 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-white/20"
                    />
                    <div className="flex justify-between">
                      <Button variant="outline">Save as Draft</Button>
                      <Button className="btn-neon">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Optimize & Post
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-neon-blue transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {post.platform === "Twitter" && <Twitter className="w-5 h-5 text-blue-400" />}
                          {post.platform === "LinkedIn" && <Linkedin className="w-5 h-5 text-blue-600" />}
                          {post.platform === "Instagram" && <Instagram className="w-5 h-5 text-pink-500" />}
                          {post.platform === "Facebook" && <Facebook className="w-5 h-5 text-blue-500" />}
                          <span className="font-medium">{post.platform}</span>
                          <Badge variant={post.status === "Published" ? "default" : "secondary"}>{post.status}</Badge>
                        </div>
                        <span className="text-sm text-gray-400">{post.timestamp}</span>
                      </div>

                      <p className="text-gray-300 mb-4">{post.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span>{post.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="w-4 h-4 text-green-400" />
                            <span>{post.shares}</span>
                          </div>
                        </div>
                        <Badge
                          className={
                            post.engagement === "Excellent"
                              ? "bg-neon-green/20 text-neon-green"
                              : post.engagement === "Very High"
                                ? "bg-neon-blue/20 text-neon-blue"
                                : post.engagement === "High"
                                  ? "bg-neon-purple/20 text-neon-purple"
                                  : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {post.engagement}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-neon-blue" />
                  Upcoming Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPosts.map((post, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/40 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        {post.platform === "Twitter" && <Twitter className="w-5 h-5 text-blue-400" />}
                        {post.platform === "LinkedIn" && <Linkedin className="w-5 h-5 text-blue-600" />}
                        {post.platform === "Instagram" && <Instagram className="w-5 h-5 text-pink-500" />}
                        <div>
                          <p className="text-sm font-medium">{post.content}</p>
                          <p className="text-xs text-gray-400">{post.scheduledTime}</p>
                        </div>
                      </div>
                      <Badge variant={post.status === "Scheduled" ? "default" : "secondary"}>{post.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-neon-green mb-2">+12.5%</div>
                  <p className="text-sm text-gray-400">vs last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Avg. Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-neon-blue mb-2">4.2%</div>
                  <p className="text-sm text-gray-400">across all platforms</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Best Time to Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-neon-purple mb-2">2-4 PM</div>
                  <p className="text-sm text-gray-400">EST weekdays</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-suggestions" className="space-y-6">
            <div className="grid gap-6">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-neon-purple transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-neon-blue/20">
                          <suggestion.icon className="w-5 h-5 text-neon-blue" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{suggestion.type}</h3>
                            <Badge
                              className={
                                suggestion.potential === "Very High"
                                  ? "bg-neon-green/20 text-neon-green"
                                  : suggestion.potential === "High"
                                    ? "bg-neon-blue/20 text-neon-blue"
                                    : "bg-neon-purple/20 text-neon-purple"
                              }
                            >
                              {suggestion.potential} Potential
                            </Badge>
                          </div>
                          <p className="text-gray-300 mb-4">{suggestion.content}</p>
                          <Button size="sm" className="btn-neon">
                            Apply Suggestion
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
