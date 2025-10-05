"use client"

import { useState } from "react"
import PageLayout from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  ImageIcon,
  Film,
  File,
  Upload,
  Grid3x3,
  List,
  Star,
  MoreVertical,
  Share2,
  Download,
  Trash2,
  Eye,
  Clock,
  User,
  HardDrive,
} from "lucide-react"
import { motion } from "framer-motion"

interface Document {
  id: string
  name: string
  type: "document" | "image" | "video" | "other"
  size: number
  owner: string
  sharedWith: number
  lastModified: string
  starred: boolean
  thumbnail?: string
}

const documents: Document[] = [
  {
    id: "1",
    name: "Marketing Strategy 2024.pdf",
    type: "document",
    size: 2.4 * 1024 * 1024,
    owner: "Sarah Johnson",
    sharedWith: 5,
    lastModified: "2024-01-15T10:30:00",
    starred: true,
  },
  {
    id: "2",
    name: "Brand Guidelines.pdf",
    type: "document",
    size: 8.7 * 1024 * 1024,
    owner: "Michael Chen",
    sharedWith: 12,
    lastModified: "2024-01-14T15:45:00",
    starred: true,
  },
  {
    id: "3",
    name: "Product Photos.zip",
    type: "image",
    size: 45.2 * 1024 * 1024,
    owner: "Emily Rodriguez",
    sharedWith: 3,
    lastModified: "2024-01-13T09:20:00",
    starred: false,
  },
  {
    id: "4",
    name: "Campaign Video Final.mp4",
    type: "video",
    size: 128.5 * 1024 * 1024,
    owner: "David Kim",
    sharedWith: 8,
    lastModified: "2024-01-12T14:10:00",
    starred: false,
  },
  {
    id: "5",
    name: "Analytics Report Q4.xlsx",
    type: "document",
    size: 1.8 * 1024 * 1024,
    owner: "Lisa Anderson",
    sharedWith: 6,
    lastModified: "2024-01-11T11:00:00",
    starred: false,
  },
  {
    id: "6",
    name: "Customer Research.docx",
    type: "document",
    size: 3.2 * 1024 * 1024,
    owner: "Sarah Johnson",
    sharedWith: 4,
    lastModified: "2024-01-10T16:30:00",
    starred: true,
  },
]

const storageStats = {
  total: 50 * 1024 * 1024 * 1024,
  used: 18.5 * 1024 * 1024 * 1024,
  byType: {
    documents: 8.2 * 1024 * 1024 * 1024,
    images: 5.1 * 1024 * 1024 * 1024,
    videos: 4.8 * 1024 * 1024 * 1024,
    other: 0.4 * 1024 * 1024 * 1024,
  },
}

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [filter, setFilter] = useState("all")

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-8 w-8 text-[#00D9FF]" />
      case "image":
        return <ImageIcon className="h-8 w-8 text-[#B14BFF]" />
      case "video":
        return <Film className="h-8 w-8 text-[#FF006B]" />
      default:
        return <File className="h-8 w-8 text-gray-400" />
    }
  }

  const filteredDocs = documents.filter((doc) => {
    if (filter === "starred") return doc.starred
    if (filter === "mine") return doc.owner === "Sarah Johnson"
    if (filter === "shared") return doc.sharedWith > 0
    return true
  })

  return (
    <PageLayout
      title="Documents"
      subtitle="Manage and share your files"
      actions={
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90">
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0E0F1A] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>Drag and drop files or click to browse</DialogDescription>
            </DialogHeader>
            <div className="py-8">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-[#00D9FF]/50 transition-all cursor-pointer bg-white/5">
                <Upload className="h-12 w-12 mx-auto mb-4 text-[#00D9FF]" />
                <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-400">Supports: PDF, DOCX, XLSX, PNG, JPG, MP4, ZIP</p>
                <p className="text-xs text-gray-500 mt-2">Maximum file size: 100 MB</p>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#00D9FF]" />
                    <div>
                      <p className="text-sm font-medium">example-file.pdf</p>
                      <p className="text-xs text-gray-400">2.4 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]" style={{ width: "65%" }} />
                    </div>
                    <span className="text-xs text-gray-400">65%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]">Start Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Storage Stats */}
        <Card className="bg-gradient-to-br from-[#00D9FF]/20 to-[#B14BFF]/20 backdrop-blur-xl border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Overview
                </CardTitle>
                <CardDescription>
                  {formatFileSize(storageStats.used)} of {formatFileSize(storageStats.total)} used
                </CardDescription>
              </div>
              <Button variant="outline" className="bg-transparent border-white/10">
                Upgrade Storage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(storageStats.used / storageStats.total) * 100}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Documents", size: storageStats.byType.documents, color: "#00D9FF" },
                  { label: "Images", size: storageStats.byType.images, color: "#B14BFF" },
                  { label: "Videos", size: storageStats.byType.videos, color: "#FF006B" },
                  { label: "Other", size: storageStats.byType.other, color: "#00FF94" },
                ].map((type) => (
                  <div key={type.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <div>
                      <p className="text-xs text-gray-400">{type.label}</p>
                      <p className="text-sm font-medium">{formatFileSize(type.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="bg-[#0E0F1A]/60 backdrop-blur-xl border border-white/10">
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="mine">My Documents</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select defaultValue="recent">
              <SelectTrigger className="w-40 bg-[#0E0F1A]/60 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0E0F1A] border-white/10">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 p-1 bg-[#0E0F1A]/60 backdrop-blur-xl border border-white/10 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-white/10" : ""}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-white/10" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Documents Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#00D9FF]/50 transition-all group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-lg bg-white/5">{getFileIcon(doc.type)}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                            doc.starred ? "text-[#FF006B]" : ""
                          }`}
                        >
                          <Star className="h-4 w-4" fill={doc.starred ? "currentColor" : "none"} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0E0F1A] border-white/10">
                            <DropdownMenuItem className="hover:bg-white/10" onClick={() => setSelectedDoc(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/10">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/10">
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="hover:bg-[#FF006B]/10 text-[#FF006B]">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <User className="h-3 w-3" />
                        <span className="text-xs text-gray-400">{doc.owner}</span>
                        {doc.sharedWith > 0 && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-400">Shared with {doc.sharedWith}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {filteredDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-white/5">{getFileIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{doc.owner}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                          </div>
                          {doc.sharedWith > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                <span>{doc.sharedWith} people</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          doc.starred ? "text-[#FF006B]" : ""
                        }`}
                      >
                        <Star className="h-4 w-4" fill={doc.starred ? "currentColor" : "none"} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0E0F1A] border-white/10">
                          <DropdownMenuItem className="hover:bg-white/10" onClick={() => setSelectedDoc(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem className="hover:bg-[#FF006B]/10 text-[#FF006B]">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Detail Modal */}
        <Dialog open={selectedDoc !== null} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="bg-[#0E0F1A] border-white/10 max-w-2xl">
            {selectedDoc && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getFileIcon(selectedDoc.type)}
                    {selectedDoc.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="aspect-video bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">File Preview</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">File Size</Label>
                      <p className="text-sm font-medium">{formatFileSize(selectedDoc.size)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Last Modified</Label>
                      <p className="text-sm font-medium">{new Date(selectedDoc.lastModified).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Owner</Label>
                      <p className="text-sm font-medium">{selectedDoc.owner}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Shared With</Label>
                      <p className="text-sm font-medium">{selectedDoc.sharedWith} people</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Version History</Label>
                    <div className="space-y-2">
                      {[
                        { version: "v3", date: "2024-01-15 10:30", user: "Sarah Johnson", current: true },
                        { version: "v2", date: "2024-01-14 15:20", user: "Michael Chen", current: false },
                        { version: "v1", date: "2024-01-10 09:15", user: "Sarah Johnson", current: false },
                      ].map((version) => (
                        <div
                          key={version.version}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={
                                version.current
                                  ? "bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]/30"
                                  : "bg-white/10 text-gray-400"
                              }
                            >
                              {version.version}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{version.date}</p>
                              <p className="text-xs text-gray-400">by {version.user}</p>
                            </div>
                          </div>
                          {!version.current && (
                            <Button variant="outline" size="sm" className="bg-transparent border-white/10">
                              Restore
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Share Settings</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter email address"
                        className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                      />
                      <div className="flex gap-2">
                        <Select defaultValue="view">
                          <SelectTrigger className="w-32 bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0E0F1A] border-white/10">
                            <SelectItem value="view">Can view</SelectItem>
                            <SelectItem value="edit">Can edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="flex-1 bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]">Share</Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="gap-2 bg-transparent border-white/10">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="gap-2 text-[#FF006B] bg-transparent border-[#FF006B]/30">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
