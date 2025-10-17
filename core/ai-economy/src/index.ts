export { TokenManager } from './tokens/TokenManager';
export { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
export { TransactionProcessor } from './transactions/TransactionProcessor';

// Types
export * from './types';

// AI Economy Manager - Main orchestrator
import { TokenManager } from './tokens/TokenManager';
import { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
import { TransactionProcessor } from './transactions/TransactionProcessor';
import { EconomicConfig, EconomicMetrics, EconomicAgent } from './types';

export class AIEconomy {
  private tokenManager: TokenManager;
  private pricingEngine: DynamicPricingEngine;
  private transactionProcessor: TransactionProcessor;
  private config: EconomicConfig;
  private isActive = false;

  constructor(config: EconomicConfig) {
    this.config = config;
    this.tokenManager = new TokenManager(config);
    this.pricingEngine = new DynamicPricingEngine();
    this.transactionProcessor = new TransactionProcessor(
      this.tokenManager,
      this.pricingEngine
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Subscribe to price updates
    this.pricingEngine.getPriceUpdateObservable().subscribe(updates => {
      console.log('Price updates:', updates);
    });

    // Subscribe to transaction metrics
    this.transactionProcessor.getTransactionMetricsObservable().subscribe(metrics => {
      if (metrics) {
        console.log('Economic metrics updated:', metrics);
      }
    });
  }

  public async startEconomy(): Promise<void> {
    this.isActive = true;
    console.log('AI Economy started');

    // Initialize economic agents
    await this.initializeEconomicAgents();

    // Start periodic economic activities
    this.startEconomicCycles();
  }

  public async stopEconomy(): Promise<void> {
    this.isActive = false;
    console.log('AI Economy stopped');
  }

  private async initializeEconomicAgents(): Promise<void> {
    // Create default economic agents
    const agents: EconomicAgent[] = [
      {
        id: 'system-agent',
        type: 'service',
        reputation: 1.0,
        stake: 1000000,
        rewards: 0,
        penalties: 0,
        lastActivity: new Date(),
        status: 'active'
      },
      {
        id: 'federation-agent',
        type: 'federation_node',
        reputation: 0.9,
        stake: 500000,
        rewards: 0,
        penalties: 0,
        lastActivity: new Date(),
        status: 'active'
      }
    ];

    for (const agent of agents) {
      this.transactionProcessor.registerEconomicAgent(agent);
      // Mint initial tokens for agents
      await this.transactionProcessor.processTransaction({
        type: 'mint',
        fromAddress: 'system',
        toAddress: agent.id,
        tokenId: 'neon-token',
        amount: agent.stake,
        fee: 0,
        metadata: { reason: 'initial_stake' }
      });
    }
  }

  private startEconomicCycles(): void {
    // Periodic token redistribution
    setInterval(() => {
      if (this.isActive) {
        this.tokenManager.redistributeTokens();
      }
    }, 24 * 60 * 60 * 1000); // Daily

    // Economic metrics updates
    setInterval(() => {
      if (this.isActive) {
        const metrics = this.transactionProcessor.getEconomicMetrics();
        if (metrics) {
          this.pricingEngine.updateEconomicMetrics(metrics);
        }
      }
    }, 60 * 1000); // Every minute
  }

  public async processTransaction(
    type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake' | 'reward',
    fromAddress: string,
    toAddress: string,
    tokenId: string,
    amount: number,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    if (!this.isActive) {
      throw new Error('AI Economy is not active');
    }

    return await this.transactionProcessor.processTransaction({
      type,
      fromAddress,
      toAddress,
      tokenId,
      amount,
      fee: this.calculateTransactionFee(amount),
      metadata
    });
  }

  private calculateTransactionFee(amount: number): number {
    return amount * this.config.transactionFeeRate;
  }

  public getTokenBalance(tokenId: string, holderId: string): number {
    return this.tokenManager.getBalance(tokenId, holderId);
  }

  public getTokenPrice(tokenId: string): number {
    return this.pricingEngine.getCurrentPrice(tokenId);
  }

  public getEconomicMetrics(): EconomicMetrics | null {
    return this.transactionProcessor.getEconomicMetrics();
  }

  public getTransactionHistory(address?: string, limit: number = 100): any[] {
    return this.transactionProcessor.getTransactionHistory(address, limit);
  }

  public registerEconomicAgent(agent: EconomicAgent): void {
    this.transactionProcessor.registerEconomicAgent(agent);
  }

  public getAgentReputation(agentId: string): number {
    return this.transactionProcessor.getAgentReputation(agentId);
  }

  public getTokenStats(tokenId: string): any {
    return this.tokenManager.getTokenStats(tokenId);
  }

  public getPricingAnalytics(tokenId: string): any {
    return this.pricingEngine.getPricingAnalytics(tokenId);
  }

  public getSystemHealth(): 'healthy' | 'unstable' | 'critical' {
    const metrics = this.getEconomicMetrics();
    if (!metrics) return 'critical';

    const efficiency = metrics.marketEfficiency;
    const volume = metrics.transactionVolume24h;

    if (efficiency > 0.8 && volume > 10000) {
      return 'healthy';
    } else if (efficiency > 0.5 || volume > 1000) {
      return 'unstable';
    } else {
      return 'critical';
    }
  }

  public async rewardAgent(agentId: string, amount: number, reason: string): Promise<void> {
    await this.processTransaction(
      'reward',
      'system',
      agentId,
      'neon-token',
      amount,
      { reason, type: 'agent_reward' }
    );
  }

  public async penalizeAgent(agentId: string, amount: number, reason: string): Promise<void> {
    await this.processTransaction(
      'burn',
      agentId,
      'system',
      'neon-token',
      amount,
      { reason, type: 'agent_penalty' }
    );
  }

  public getAllTokens(): any[] {
    return this.tokenManager.getAllTokens();
  }

  public getPendingTransactions(): any[] {
    return this.transactionProcessor.getPendingTransactions();
  }
}