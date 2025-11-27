/**
 * Learning Context Helper
 * Retrieves past agent performance and memories to augment current prompts
 * Enables agents to learn from historical performance
 */

import { recallAgentContext } from "../../services/agent-learning.service.js";
import { logger } from "../../lib/logger.js";

export interface LearningContext {
  pastPerformance: string;
  relatedMemories: string;
  insights: string;
}

/**
 * Build augmented system prompt with learning context
 * Includes past successful patterns and learned insights
 */
export async function buildLearningAugmentedPrompt(
  agentId: string,
  basePrompt: string,
  intent: string,
  options: { maxMemories?: number; includeContext?: boolean } = {}
): Promise<{ prompt: string; context: LearningContext }> {
  const { maxMemories = 5, includeContext = true } = options;

  const context: LearningContext = {
    pastPerformance: "",
    relatedMemories: "",
    insights: "",
  };

  if (!includeContext) {
    return { prompt: basePrompt, context };
  }

  try {
    // Recall similar past executions
    const memories = await recallAgentContext(agentId, intent, maxMemories);

    if (memories && memories.length > 0) {
      context.relatedMemories = memories
        .map((m, i) => `[Memory ${i + 1}] ${m.content}`)
        .join("\n\n");

      context.pastPerformance = `Based on ${memories.length} similar past execution(s):`;
      context.insights = "Apply these learned patterns: focus on what worked previously.";
    }
  } catch (error) {
    logger.debug(
      { error: error instanceof Error ? error.message : String(error), agentId },
      "Failed to recall agent context (non-critical)"
    );
    // Non-critical: continue without memory augmentation
  }

  // Build augmented prompt
  const augmentedPrompt = `${basePrompt}

${context.pastPerformance ? `\n## Learned Context\n${context.pastPerformance}\n${context.insights}` : ""}
${context.relatedMemories ? `\n## Related Past Performance\n${context.relatedMemories}` : ""}`;

  return { prompt: augmentedPrompt, context };
}

/**
 * Format learning context for logging/telemetry
 */
export function formatLearningContext(context: LearningContext): Record<string, unknown> {
  return {
    hasMemories: Boolean(context.relatedMemories),
    memoryCount: context.relatedMemories.split("[Memory").length - 1,
    contextLength: context.relatedMemories.length + context.insights.length,
  };
}
