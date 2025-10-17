import { EventEmitter } from 'events';
import { logger } from '../../backend/src/lib/logger';
import { AgentMessage, AgentContext, AgentEvent } from './types';

export class AgentIntelligenceBus extends EventEmitter {
  private agents: Map<string, AgentContext> = new Map();
  private messageQueue: AgentMessage[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private get logger() {
    return logger;
  }

  private setupEventHandlers() {
    this.on('agent:register', this.handleAgentRegistration.bind(this));
    this.on('agent:message', this.handleAgentMessage.bind(this));
    this.on('agent:unregister', this.handleAgentUnregistration.bind(this));
  }

  async registerAgent(agentId: string, context: AgentContext): Promise<void> {
    this.agents.set(agentId, context);
    this.logger.info(`Agent ${agentId} registered with AIB`, { agentId, capabilities: context.capabilities });
    this.emit('agent:register', { agentId, context });
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    this.logger.info(`Agent ${agentId} unregistered from AIB`, { agentId });
    this.emit('agent:unregister', { agentId });
  }

  async broadcastMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    if (!this.isProcessing) {
      await this.processMessageQueue();
    }
  }

  async sendMessage(targetAgentId: string, message: AgentMessage): Promise<void> {
    const targetAgent = this.agents.get(targetAgentId);
    if (!targetAgent) {
      throw new Error(`Agent ${targetAgentId} not found`);
    }

    try {
      await targetAgent.handler(message);
      this.logger.debug(`Message sent to agent ${targetAgentId}`, { messageId: message.id });
    } catch (error) {
      this.logger.error(`Failed to send message to agent ${targetAgentId}`, { error, messageId: message.id });
      throw error;
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.routeMessage(message);
    }

    this.isProcessing = false;
  }

  private async routeMessage(message: AgentMessage): Promise<void> {
    const targetAgents = this.findTargetAgents(message);

    for (const agentId of targetAgents) {
      try {
        await this.sendMessage(agentId, message);
      } catch (error) {
        this.logger.error(`Failed to route message to ${agentId}`, { error, messageId: message.id });
      }
    }
  }

  private findTargetAgents(message: AgentMessage): string[] {
    const targetAgents: string[] = [];

    this.agents.forEach((context, agentId) => {
      if (context.capabilities.includes(message.type)) {
        targetAgents.push(agentId);
      }
    });

    return targetAgents;
  }

  private handleAgentRegistration(event: AgentEvent) {
    this.logger.info(`Agent registration event processed`, { agentId: event.agentId });
  }

  private handleAgentMessage(event: AgentEvent) {
    this.logger.debug(`Agent message event processed`, { agentId: event.agentId });
  }

  private handleAgentUnregistration(event: AgentEvent) {
    this.logger.info(`Agent unregistration event processed`, { agentId: event.agentId });
  }

  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  getAgentContext(agentId: string): AgentContext | undefined {
    return this.agents.get(agentId);
  }
}

export { AgentIntelligenceBus as AIB, AgentMessage, AgentContext, AgentEvent };