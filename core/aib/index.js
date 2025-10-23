import { EventEmitter } from 'events';
// Simple logger implementation
const logger = {
    info: (message, meta) => console.log(`[AIB INFO] ${message}`, meta || ''),
    debug: (message, meta) => console.debug(`[AIB DEBUG] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[AIB ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[AIB WARN] ${message}`, meta || '')
};
export class AgentIntelligenceBus extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.messageQueue = [];
        this.isProcessing = false;
        this.setupEventHandlers();
    }
    get logger() {
        return logger;
    }
    setupEventHandlers() {
        this.on('agent:register', this.handleAgentRegistration.bind(this));
        this.on('agent:message', this.handleAgentMessage.bind(this));
        this.on('agent:unregister', this.handleAgentUnregistration.bind(this));
    }
    async registerAgent(agentId, context) {
        this.agents.set(agentId, context);
        this.logger.info(`Agent ${agentId} registered with AIB`, { agentId, capabilities: context.capabilities });
        this.emit('agent:register', { agentId, context });
    }
    async unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.logger.info(`Agent ${agentId} unregistered from AIB`, { agentId });
        this.emit('agent:unregister', { agentId });
    }
    async broadcastMessage(message) {
        this.messageQueue.push(message);
        if (!this.isProcessing) {
            await this.processMessageQueue();
        }
    }
    async sendMessage(targetAgentId, message) {
        const targetAgent = this.agents.get(targetAgentId);
        if (!targetAgent) {
            throw new Error(`Agent ${targetAgentId} not found`);
        }
        try {
            await targetAgent.handler(message);
            this.logger.debug(`Message sent to agent ${targetAgentId}`, { messageId: message.id });
        }
        catch (error) {
            this.logger.error(`Failed to send message to agent ${targetAgentId}`, { error, messageId: message.id });
            throw error;
        }
    }
    async processMessageQueue() {
        if (this.isProcessing || this.messageQueue.length === 0)
            return;
        this.isProcessing = true;
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            await this.routeMessage(message);
        }
        this.isProcessing = false;
    }
    async routeMessage(message) {
        const targetAgents = this.findTargetAgents(message);
        for (const agentId of targetAgents) {
            try {
                await this.sendMessage(agentId, message);
            }
            catch (error) {
                this.logger.error(`Failed to route message to ${agentId}`, { error, messageId: message.id });
            }
        }
    }
    findTargetAgents(message) {
        const targetAgents = [];
        this.agents.forEach((context, agentId) => {
            if (context.capabilities.includes(message.type)) {
                targetAgents.push(agentId);
            }
        });
        return targetAgents;
    }
    handleAgentRegistration(event) {
        this.logger.info(`Agent registration event processed`, { agentId: event.agentId });
    }
    handleAgentMessage(event) {
        this.logger.debug(`Agent message event processed`, { agentId: event.agentId });
    }
    handleAgentUnregistration(event) {
        this.logger.info(`Agent unregistration event processed`, { agentId: event.agentId });
    }
    getRegisteredAgents() {
        return Array.from(this.agents.keys());
    }
    getAgentContext(agentId) {
        return this.agents.get(agentId);
    }
}
export { AgentIntelligenceBus as AIB };
//# sourceMappingURL=index.js.map