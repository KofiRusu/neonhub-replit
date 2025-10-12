"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, FileText, Calendar, Copy, Eye } from "lucide-react"

interface Source {
  title: string
  url?: string
  updatedAt: string
  type?: "document" | "webpage" | "policy" | "guideline"
}

interface SourceCitationsProps {
  sources: Source[]
  compact?: boolean
}

export default function SourceCitations({ sources, compact = false }: SourceCitationsProps) {
  const handleCopyReference = (source: Source) => {
    const reference = `[${source.title}](${source.url || "#"})`
    navigator.clipboard.writeText(reference)
  }

  const handleOpenSource = (source: Source) => {
    if (source.url) {
      window.open(source.url, "_blank")
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "document":
        return "border-[#00D4FF]/30 text-[#00D4FF]"
      case "webpage":
        return "border-[#00FF88]/30 text-[#00FF88]"
      case "policy":
        return "border-[#FF006B]/30 text-[#FF006B]"
      case "guideline":
        return "border-[#B084FF]/30 text-[#B084FF]"
      default:
        return "border-gray-500/30 text-gray-400"
    }
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400">Sources:</span>
        <div className="flex items-center space-x-1">
          {sources.slice(0, 3).map((source, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleOpenSource(source)}
              className="h-6 px-2 text-xs text-[#00D4FF] hover:text-[#00D4FF]/80"
            >
              {source.title.length > 20 ? `${source.title.substring(0, 20)}...` : source.title}
            </Button>
          ))}
          {sources.length > 3 && (
            <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
              +{sources.length - 3} more
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="flex items-center space-x-2">
        <FileText className="w-3 h-3 text-gray-400" />
        <span className="text-xs font-medium text-gray-400">Sources ({sources.length})</span>
      </div>

      <div className="space-y-2">
        {sources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#0A0A0F]/30 rounded border border-white/5 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-medium text-white">{source.title}</h4>
                  {source.type && (
                    <Badge variant="outline" className={`text-xs ${getTypeColor(source.type)}`}>
                      {source.type}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {new Date(source.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {source.url && (
                    <div className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>External link</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyReference(source)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {source.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenSource(source)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
