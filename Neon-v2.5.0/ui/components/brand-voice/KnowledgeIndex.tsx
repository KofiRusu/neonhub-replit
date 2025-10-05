"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  FileText,
  ExternalLink,
  Copy,
  Plus,
  Calendar,
  User,
  Tag,
  Star,
  MoreHorizontal,
} from "lucide-react"

interface KnowledgeDoc {
  id: string
  title: string
  type: "policy" | "playbook" | "campaign" | "styleguide" | "template" | "research"
  content: string
  tags: string[]
  agent: string
  owner: string
  updatedAt: string
  isCanonical: boolean
  url?: string
}

interface KnowledgeIndexProps {
  query?: string
  onInsert?: (doc: KnowledgeDoc) => void
}

const mockDocs: KnowledgeDoc[] = [
  {
    id: "1",
    title: "Brand Voice Guidelines v2.1",
    type: "styleguide",
    content: "Comprehensive guide to NeonHub's brand voice, tone, and messaging standards...",
    tags: ["brand", "voice", "guidelines", "tone"],
    agent: "Brand Voice",
    owner: "Sarah Johnson",
    updatedAt: "2024-01-15",
    isCanonical: true,
    url: "/docs/brand-guidelines",
  },
  {
    id: "2",
    title: "Social Media Content Playbook",
    type: "playbook",
    content: "Best practices for creating engaging social media content across all platforms...",
    tags: ["social", "content", "playbook", "engagement"],
    agent: "Social Media",
    owner: "Mike Chen",
    updatedAt: "2024-01-12",
    isCanonical: true,
  },
  {
    id: "3",
    title: "Q4 Campaign Performance Analysis",
    type: "research",
    content: "Detailed analysis of Q4 marketing campaigns including ROI, engagement metrics...",
    tags: ["campaign", "analysis", "Q4", "performance", "ROI"],
    agent: "Analytics",
    owner: "Emma Davis",
    updatedAt: "2024-01-10",
    isCanonical: false,
  },
  {
    id: "4",
    title: "Email Marketing Compliance Policy",
    type: "policy",
    content: "Legal requirements and best practices for email marketing compliance...",
    tags: ["email", "compliance", "legal", "GDPR", "CAN-SPAM"],
    agent: "Email Marketing",
    owner: "Legal Team",
    updatedAt: "2024-01-08",
    isCanonical: true,
  },
  {
    id: "5",
    title: "SEO Content Template",
    type: "template",
    content: "Standard template for creating SEO-optimized blog posts and landing pages...",
    tags: ["SEO", "template", "content", "optimization"],
    agent: "SEO",
    owner: "Tom Wilson",
    updatedAt: "2024-01-05",
    isCanonical: false,
  },
  {
    id: "6",
    title: "Customer Support Response Guidelines",
    type: "playbook",
    content: "Guidelines for maintaining brand voice in customer support interactions...",
    tags: ["support", "customer", "response", "guidelines"],
    agent: "Support",
    owner: "Lisa Park",
    updatedAt: "2024-01-03",
    isCanonical: true,
  },
]

const typeColors = {
  policy: "border-[#FF006B]/30 text-[#FF006B]",
  playbook: "border-[#00D4FF]/30 text-[#00D4FF]",
  campaign: "border-[#B084FF]/30 text-[#B084FF]",
  styleguide: "border-[#00FF88]/30 text-[#00FF88]",
  template: "border-yellow-500/30 text-yellow-500",
  research: "border-orange-500/30 text-orange-500",
}

const typeIcons = {
  policy: "🛡️",
  playbook: "📋",
  campaign: "🎯",
  styleguide: "🎨",
  template: "📄",
  research: "📊",
}

export default function KnowledgeIndex({ query = "", onInsert }: KnowledgeIndexProps) {
  const [searchQuery, setSearchQuery] = useState(query)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("updated")

  const filteredDocs = useMemo(() => {
    let filtered = mockDocs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((doc) => doc.type === typeFilter)
    }

    // Agent filter
    if (agentFilter !== "all") {
      filtered = filtered.filter((doc) => doc.agent === agentFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "type":
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, typeFilter, agentFilter, sortBy])

  const uniqueAgents = Array.from(new Set(mockDocs.map((doc) => doc.agent)))

  const handleCopyRef = (doc: KnowledgeDoc) => {
    navigator.clipboard.writeText(`[${doc.title}](${doc.url || `#doc-${doc.id}`})`)
  }

  const handleInsert = (doc: KnowledgeDoc) => {
    onInsert?.(doc)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Knowledge Index</h2>
          <p className="text-sm text-gray-400">
            {filteredDocs.length} of {mockDocs.length} documents
          </p>
        </div>

        <Button className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] hover:from-[#00FF88]/80 hover:to-[#00D4FF]/80">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 bg-[#2A2B35]/50 border-white/10 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2B35] border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">
                  All Types
                </SelectItem>
                <SelectItem value="policy" className="text-white hover:bg-white/10">
                  Policy
                </SelectItem>
                <SelectItem value="playbook" className="text-white hover:bg-white/10">
                  Playbook
                </SelectItem>
                <SelectItem value="campaign" className="text-white hover:bg-white/10">
                  Campaign
                </SelectItem>
                <SelectItem value="styleguide" className="text-white hover:bg-white/10">
                  Style Guide
                </SelectItem>
                <SelectItem value="template" className="text-white hover:bg-white/10">
                  Template
                </SelectItem>
                <SelectItem value="research" className="text-white hover:bg-white/10">
                  Research
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-40 bg-[#2A2B35]/50 border-white/10 text-white">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2B35] border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">
                  All Agents
                </SelectItem>
                {uniqueAgents.map((agent) => (
                  <SelectItem key={agent} value={agent} className="text-white hover:bg-white/10">
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-[#2A2B35]/50 border-white/10 text-white">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2B35] border-white/10">
                <SelectItem value="updated" className="text-white hover:bg-white/10">
                  Updated
                </SelectItem>
                <SelectItem value="title" className="text-white hover:bg-white/10">
                  Title
                </SelectItem>
                <SelectItem value="type" className="text-white hover:bg-white/10">
                  Type
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-400 hover:text-white bg-transparent"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredDocs.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-6 hover:bg-[#1A1B23]/70 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{typeIcons[doc.type]}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white hover:text-[#00D4FF] cursor-pointer">{doc.title}</h3>
                          {doc.isCanonical && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {doc.url && <ExternalLink className="w-3 h-3 text-gray-400" />}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{doc.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{doc.owner}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className={typeColors[doc.type]}>
                        {doc.type}
                      </Badge>
                      <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                        {doc.agent}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, tagIndex) => (
                        <Badge
                          key={tagIndex}
                          variant="secondary"
                          className="text-xs bg-[#2A2B35]/50 text-gray-300 hover:bg-[#2A2B35]/70"
                        >
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyRef(doc)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {onInsert && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInsert(doc)}
                        className="text-[#00D4FF] hover:text-[#00D4FF]/80"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredDocs.length === 0 && (
          <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No documents found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search criteria or add new documents to the knowledge base.
            </p>
            <Button className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] hover:from-[#00FF88]/80 hover:to-[#00D4FF]/80">
              <Plus className="w-4 h-4 mr-2" />
              Add First Document
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
