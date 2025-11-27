"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Eye, Edit, Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  topic: string;
  kind: string;
  status: string;
  tone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostListProps {
  posts?: Post[];
  isLoading?: boolean;
  onDelete?: (id: string) => void | Promise<void>;
}

/**
 * Post List Component
 * 
 * Displays content drafts and published content in a table/card view
 * - Sortable columns
 * - Status badges
 * - Quick actions (view, edit, delete)
 * - Empty state
 * - Loading skeletons
 */
export function PostList({ posts = [], isLoading = false, onDelete }: PostListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No content yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm">
            Create your first piece of content to get started with AI-powered marketing
          </p>
          <Button asChild>
            <Link href="/content/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Content
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const getKindColor = (kind: string) => {
    const colors: Record<string, string> = {
      article: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      email: "bg-green-500/20 text-green-400 border-green-500/30",
      social_script: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      ad_copy: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[kind] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-yellow-500/20 text-yellow-400",
      review: "bg-blue-500/20 text-blue-400",
      published: "bg-green-500/20 text-green-400",
      archived: "bg-gray-500/20 text-gray-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="p-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Content Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                <Badge className={getStatusColor(post.status)} variant="outline">
                  {post.status}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                {post.topic}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <Badge className={getKindColor(post.kind)} variant="outline">
                  {post.kind.replace("_", " ")}
                </Badge>
                <span>•</span>
                <span className="capitalize">{post.tone} tone</span>
                <span>•</span>
                <span>
                  Updated {new Date(post.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {post.status === "draft" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  aria-label={`Review ${post.title}`}
                >
                  <Link href={`/content/${post.id}/review`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </Link>
                </Button>
              )}

              {post.status === "published" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  aria-label={`View ${post.title}`}
                >
                  <Link href={`/content/${post.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${post.title}`}
                onClick={() => {
                  if (confirm(`Delete "${post.title}"?`)) {
                    onDelete?.(post.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


