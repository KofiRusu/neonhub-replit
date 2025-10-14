import { Job } from "bullmq";

export interface ContentGenerationJobData {
  userId: string;
  contentType: "article" | "social" | "email";
  prompt: string;
  tone?: string;
  audience?: string;
}

export async function processContentGeneration(job: Job<ContentGenerationJobData>) {
  console.log(`Processing content generation job ${job.id} for user ${job.data.userId}`);
  
  try {
    // Simulate content generation processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      id: job.id,
      content: `Generated ${job.data.contentType} content: ${job.data.prompt}`,
      metadata: {
        tone: job.data.tone || "professional",
        audience: job.data.audience || "general",
        generatedAt: new Date().toISOString()
      }
    };
    
    console.log(`Content generation job ${job.id} completed successfully`);
    return result;
  } catch (error) {
    console.error(`Content generation job ${job.id} failed:`, error);
    throw error;
  }
}