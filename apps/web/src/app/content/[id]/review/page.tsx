"use client";

import { useParams, useRouter } from "next/navigation";
import { PostComposer } from "@/components/posts/PostComposer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Post Review Page
 * 
 * Review and publish content draft
 * - Shows generated/edited content
 * - Allows final edits
 * - Publishes to live content
 */
export default function ReviewPostPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  // TODO: Fetch draft from tRPC
  // const { data: draft, isLoading } = trpc.content.getDraft.useQuery({ id: draftId });
  
  const isLoading = false;
  const draft = {
    id: draftId,
    title: "Sample Draft Title",
    topic: "AI Marketing Automation",
    kind: "article" as const,
    tone: "professional" as const,
    audience: "B2B Marketers",
    body: "This is sample generated content that would come from the AI agent...",
    status: "draft",
    createdAt: new Date(),
  };

  const handlePublish = async (data: any) => {
    try {
      // TODO: Wire to tRPC
      // await trpc.content.publish.mutate({ id: draftId, ...data });
      
      console.log("Publishing:", data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push("/content");
      alert("Published successfully!");
    } catch (error) {
      console.error("Failed to publish:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Review Content</h1>
            <p className="text-gray-400 mt-2">
              Review your AI-generated content before publishing
            </p>
          </div>
          <Badge variant="outline">Draft ID: {draftId.slice(0, 8)}</Badge>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="p-6 mb-6 bg-slate-900/60">
        <h3 className="font-semibold mb-2">Preview</h3>
        <div className="prose dark:prose-invert max-w-none">
          <h2>{draft.title}</h2>
          <div className="text-sm text-gray-400 mb-4">
            {draft.kind} • {draft.tone} tone • Target: {draft.audience || "General"}
          </div>
          <p className="whitespace-pre-wrap">{draft.body}</p>
        </div>
      </Card>

      {/* Edit Form */}
      <PostComposer
        mode="review"
        initialData={draft}
        onPublish={handlePublish}
      />
    </div>
  );
}


