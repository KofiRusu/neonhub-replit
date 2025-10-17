import { AgentIntelligenceBus, AgentMessage, AgentContext } from '../../../../core/aib';
import { getBrandProfile, searchKnowledge } from '../services/brandVoice.service';
import { logger } from '../lib/logger';

export class BrandVoiceAgent {
  private aib: AgentIntelligenceBus;
  private context: AgentContext;

  constructor(aib: AgentIntelligenceBus) {
    this.aib = aib;
    this.context = {
      id: 'brand-voice-agent',
      name: 'Brand Voice Agent',
      capabilities: ['brand-voice', 'content-generation', 'tone-analysis'],
      handler: this.handleMessage.bind(this),
      status: 'active',
      lastActivity: new Date(),
      config: {
        maxTokens: 2000,
        temperature: 0.7,
        brandGuidelines: true
      }
    };
  }

  async initialize(): Promise<void> {
    await this.aib.registerAgent(this.context.id, this.context);
    logger.info('BrandVoiceAgent registered with AIB');
  }

  async handleMessage(message: AgentMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'brand-voice':
          await this.handleBrandVoiceRequest(message);
          break;
        case 'content-generation':
          await this.handleContentGeneration(message);
          break;
        case 'tone-analysis':
          await this.handleToneAnalysis(message);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`BrandVoiceAgent error handling message: ${error} for message ${message.id}`);
      throw error;
    }
  }

  private async handleBrandVoiceRequest(message: AgentMessage): Promise<void> {
    const profile = await getBrandProfile();
    const response: AgentMessage = {
      id: `response-${message.id}`,
      type: 'brand-voice-response',
      payload: { profile, requestId: message.id },
      sender: this.context.id,
      timestamp: new Date(),
      priority: 'medium'
    };
    await this.aib.broadcastMessage(response);
  }

  private async handleContentGeneration(message: AgentMessage): Promise<void> {
    const knowledge = await searchKnowledge(message.payload.query);
    const response: AgentMessage = {
      id: `response-${message.id}`,
      type: 'content-generated',
      payload: { content: knowledge, requestId: message.id },
      sender: this.context.id,
      timestamp: new Date(),
      priority: 'medium'
    };
    await this.aib.broadcastMessage(response);
  }

  private async handleToneAnalysis(message: AgentMessage): Promise<void> {
    // Implement tone analysis logic
    const analysis = {
      tone: 'professional',
      confidence: 0.85,
      suggestions: ['Maintain consistent voice', 'Use active language']
    };

    const response: AgentMessage = {
      id: `response-${message.id}`,
      type: 'tone-analysis-result',
      payload: { analysis, requestId: message.id },
      sender: this.context.id,
      timestamp: new Date(),
      priority: 'medium'
    };
    await this.aib.broadcastMessage(response);
  }

  async shutdown(): Promise<void> {
    await this.aib.unregisterAgent(this.context.id);
    logger.info('BrandVoiceAgent unregistered from AIB');
  }
}

