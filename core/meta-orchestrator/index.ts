import { logger } from '../../apps/api/src/lib/logger';
import { AgentIntelligenceBus, AgentMessage } from '../aib';

export interface AgentPriority {
  agentId: string;
  priority: number;
  resourceAllocation: number;
  lastActivity: Date;
  performance: number;
}

export interface OrchestrationDecision {
  id: string;
  type: 'task-assignment' | 'resource-reallocation' | 'conflict-resolution' | 'load-balancing';
  agents: string[];
  action: string;
  reasoning: string;
  timestamp: Date;
  success: boolean;
}

export class MetaOrchestrator {
  private aib: AgentIntelligenceBus;
  private agentPriorities: Map<string, AgentPriority> = new Map();
  private decisionHistory: OrchestrationDecision[] = [];
  private isActive = false;

  constructor(aib: AgentIntelligenceBus) {
    this.aib = aib;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.aib.on('agent:register', this.handleAgentRegistration.bind(this));
    this.aib.on('agent:task', this.handleTaskRequest.bind(this));
    this.aib.on('system:conflict', this.handleConflict.bind(this));
  }

  async startOrchestration(): Promise<void> {
    this.isActive = true;
    logger.info('Meta-orchestrator started');

    // Initialize agent priorities
    await this.initializeAgentPriorities();

    // Start monitoring and decision making
    setInterval(() => this.makeOrchestrationDecisions(), 10000); // Every 10 seconds
  }

  async stopOrchestration(): Promise<void> {
    this.isActive = false;
    logger.info('Meta-orchestrator stopped');
  }

  private async initializeAgentPriorities(): Promise<void> {
    const registeredAgents = this.aib.getRegisteredAgents();

    for (const agentId of registeredAgents) {
      const context = this.aib.getAgentContext(agentId);
      if (context) {
        const priority: AgentPriority = {
          agentId,
          priority: this.calculateInitialPriority(context),
          resourceAllocation: 1.0,
          lastActivity: new Date(),
          performance: 1.0
        };
        this.agentPriorities.set(agentId, priority);
      }
    }
  }

  private calculateInitialPriority(context: any): number {
    // Calculate priority based on agent capabilities and criticality
    const capabilityWeights = {
      'content-generation': 0.8,
      'seo-optimization': 0.7,
      'brand-voice': 0.9,
      'support': 0.6,
      'analytics': 0.5
    };

    let priority = 0.5; // Base priority

    context.capabilities.forEach((cap: string) => {
      if (capabilityWeights[cap as keyof typeof capabilityWeights]) {
        priority += capabilityWeights[cap as keyof typeof capabilityWeights];
      }
    });

    return Math.min(priority, 1.0);
  }

  private async makeOrchestrationDecisions(): Promise<void> {
    if (!this.isActive) return;

    try {
      await this.balanceWorkload();
      await this.resolveConflicts();
      await this.optimizeResourceAllocation();
    } catch (error) {
      logger.error({ error }, 'Orchestration decision making failed');
    }
  }

  private async balanceWorkload(): Promise<void> {
    const priorities = Array.from(this.agentPriorities.values());
    const avgLoad = priorities.reduce((sum, p) => sum + p.resourceAllocation, 0) / priorities.length;

    for (const priority of priorities) {
      if (priority.resourceAllocation > avgLoad * 1.2) {
        // Agent is overloaded, reduce allocation
        priority.resourceAllocation = Math.max(0.5, priority.resourceAllocation * 0.9);
        await this.notifyAgentOfReallocation(priority.agentId, priority.resourceAllocation);
      } else if (priority.resourceAllocation < avgLoad * 0.8) {
        // Agent is underutilized, increase allocation
        priority.resourceAllocation = Math.min(2.0, priority.resourceAllocation * 1.1);
        await this.notifyAgentOfReallocation(priority.agentId, priority.resourceAllocation);
      }
    }
  }

  private async resolveConflicts(): Promise<void> {
    // Check for conflicting agent activities
    const activeAgents = Array.from(this.agentPriorities.values())
      .filter(p => p.resourceAllocation > 0.8)
      .sort((a, b) => b.priority - a.priority);

    if (activeAgents.length > 3) {
      // Too many high-priority agents active, reduce lower priority ones
      const toReduce = activeAgents.slice(3);
      for (const agent of toReduce) {
        agent.resourceAllocation *= 0.7;
        await this.notifyAgentOfReallocation(agent.agentId, agent.resourceAllocation);
      }
    }
  }

  private async optimizeResourceAllocation(): Promise<void> {
    const priorities = Array.from(this.agentPriorities.values());

    // Adjust allocations based on recent performance
    for (const priority of priorities) {
      if (priority.performance > 1.1) {
        // High performing agent, increase allocation
        priority.resourceAllocation = Math.min(2.0, priority.resourceAllocation * 1.05);
      } else if (priority.performance < 0.9) {
        // Low performing agent, decrease allocation
        priority.resourceAllocation = Math.max(0.3, priority.resourceAllocation * 0.95);
      }
    }
  }

  private async notifyAgentOfReallocation(agentId: string, newAllocation: number): Promise<void> {
    const message: AgentMessage = {
      id: `reallocation-${Date.now()}`,
      type: 'system:reallocation',
      payload: { newAllocation, reason: 'Load balancing optimization' },
      sender: 'meta-orchestrator',
      timestamp: new Date(),
      priority: 'medium'
    };

    try {
      await this.aib.sendMessage(agentId, message);
      logger.debug({ agentId, newAllocation }, `Resource reallocation notified to ${agentId}`);
    } catch (error) {
      logger.error({ agentId, error }, `Failed to notify agent ${agentId} of reallocation`);
    }
  }

  private handleAgentRegistration(event: any) {
    const agentId = event.agentId;
    const context = event.context;

    const priority: AgentPriority = {
      agentId,
      priority: this.calculateInitialPriority(context),
      resourceAllocation: 1.0,
      lastActivity: new Date(),
      performance: 1.0
    };

    this.agentPriorities.set(agentId, priority);
    logger.info({ agentId, priority: priority.priority }, `Agent priority initialized`);
  }

  private async handleTaskRequest(event: any) {
    const task = event.task;
    const bestAgent = this.selectBestAgentForTask(task);

    if (bestAgent) {
      const decision: OrchestrationDecision = {
        id: `decision-${Date.now()}`,
        type: 'task-assignment',
        agents: [bestAgent],
        action: `Assigned task ${task.id} to ${bestAgent}`,
        reasoning: `Agent ${bestAgent} has highest capability match and available resources`,
        timestamp: new Date(),
        success: false
      };

      try {
        await this.aib.sendMessage(bestAgent, {
          id: task.id,
          type: task.type,
          payload: task.payload,
          sender: 'meta-orchestrator',
          timestamp: new Date(),
          priority: task.priority || 'medium'
        });
        decision.success = true;
      } catch (error) {
        logger.error({ taskId: task.id, agentId: bestAgent, error }, `Task assignment failed`);
      }

      this.decisionHistory.push(decision);
    }
  }

  private handleConflict(event: any) {
    logger.warn({ conflict: event.conflict }, 'Agent conflict detected');
    // Implement conflict resolution logic
  }

  private selectBestAgentForTask(task: any): string | null {
    let bestAgent: string | null = null;
    let bestScore = 0;

    this.agentPriorities.forEach((priority, agentId) => {
      const context = this.aib.getAgentContext(agentId);
      if (!context) return;

      let score = priority.priority * priority.resourceAllocation * priority.performance;

      // Boost score if agent has relevant capabilities
      if (context.capabilities.includes(task.type)) {
        score *= 1.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    });

    return bestAgent;
  }

  updateAgentPerformance(agentId: string, performance: number): void {
    const priority = this.agentPriorities.get(agentId);
    if (priority) {
      priority.performance = performance;
      priority.lastActivity = new Date();
    }
  }

  getAgentPriorities(): AgentPriority[] {
    return Array.from(this.agentPriorities.values());
  }

  getDecisionHistory(): OrchestrationDecision[] {
    return this.decisionHistory;
  }

  getOrchestrationStatus(): 'active' | 'inactive' {
    return this.isActive ? 'active' : 'inactive';
  }
}