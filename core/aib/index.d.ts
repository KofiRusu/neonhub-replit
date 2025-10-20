import { EventEmitter } from 'events';
import { AgentMessage, AgentContext, AgentEvent } from './types';
export declare class AgentIntelligenceBus extends EventEmitter {
    private agents;
    private messageQueue;
    private isProcessing;
    constructor();
    private get logger();
    private setupEventHandlers;
    registerAgent(agentId: string, context: AgentContext): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    broadcastMessage(message: AgentMessage): Promise<void>;
    sendMessage(targetAgentId: string, message: AgentMessage): Promise<void>;
    private processMessageQueue;
    private routeMessage;
    private findTargetAgents;
    private handleAgentRegistration;
    private handleAgentMessage;
    private handleAgentUnregistration;
    getRegisteredAgents(): string[];
    getAgentContext(agentId: string): AgentContext | undefined;
}
export { AgentIntelligenceBus as AIB, AgentMessage, AgentContext, AgentEvent };
//# sourceMappingURL=index.d.ts.map