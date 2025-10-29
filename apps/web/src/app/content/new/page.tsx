"use client";

import { useRouter } from "next/navigation";
import { PostComposer } from "@/components/posts/PostComposer";

/**
 * New Post Creation Page
 * 
 * Allows users to create new content drafts with:
 * - Type selection (article, email, social, ad)
 * - Form validation
 * - Auto-save functionality
 * - Accessibility features
 */
export default function NewPostPage() {
  const router = useRouter();

  const handleSaveDraft = async (data: any) => {
    try {
      // TODO: Wire to tRPC when content router is implemented
      // const draft = await trpc.content.createDraft.mutate(data);
      
      console.log("Saving draft:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to review page
      // router.push(`/content/${draft.id}/review`);
      
      alert("Draft saved! (Simulated - will connect to tRPC in next step)");
    } catch (error) {
      console.error("Failed to save draft:", error);
      throw error;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Content</h1>
        <p className="text-muted-foreground mt-2">
          Generate AI-powered content for your marketing campaigns
        </p>
      </div>

      <PostComposer
        mode="draft"
        onSave={handleSaveDraft}
      />
    </div>
  );
}


