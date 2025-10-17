export interface AgentMessage {
  id: string;
  type: string;
  payload: any;
  sender: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface AgentContext {
  id: string;
  name: string;
  capabilities: string[];
  handler: (message: AgentMessage) => Promise<void>;
  status: 'active' | 'inactive' | 'error';
  lastActivity: Date;
  config: Record<string, any>;
}

export interface AgentEvent {
  agentId: string;
  eventType: string;
  data?: any;
  timestamp: Date;
}

export interface AIBConfig {
  maxQueueSize: number;
  messageTimeout: number;
  retryAttempts: number;
  enableLogging: boolean;
}

export interface CollaborationContext {
  sessionId: string;
  participants: string[];
  sharedKnowledge: Map<string, any>;
  consensusRules: string[];
  decisionHistory: AgentMessage[];
}