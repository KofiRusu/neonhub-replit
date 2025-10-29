/**
 * Budget Engine Module
 * @module modules/budget
 */

import type { HTTPClient } from '../client';
import type {
  BudgetProfile,
  BudgetAllocation,
  BudgetAllocationRequest,
  AllocationPlan,
  ReconciliationReport,
  BudgetLedger,
  Wallet,
  WalletTransaction,
  StripePayment,
  BudgetDashboard,
  SpendAlert,
} from '../types/agentic';

export class BudgetModule {
  constructor(private readonly client: HTTPClient) {}

  /**
   * Create a budget allocation plan
   *
   * @example
   * ```typescript
   * const plan = await client.budget.plan({
   *   workspaceId: 'ws_123',
   *   objectives: [
   *     { type: 'demo_book', priority: 10, targetMetric: 'conversions' }
   *   ],
   *   constraints: {
   *     totalBudget: 500000, // $5000 in cents
   *     period: 'monthly',
   *     minROAS: 2.5
   *   },
   *   strategy: 'bandit'
   * });
   *
   * console.log('Channel allocations:', plan.channels);
   * console.log('Predicted ROAS:', plan.predictions.averageROAS);
   * ```
   */
  async plan(request: BudgetAllocationRequest): Promise<AllocationPlan> {
    return this.client.post<AllocationPlan>('/api/budget/plan', {
      body: request,
    });
  }

  /**
   * Execute an approved allocation plan
   */
  async execute(allocationId: string): Promise<{ executionId: string }> {
    return this.client.post(`/api/budget/allocation/${allocationId}/execute`);
  }

  /**
   * Pause an executing allocation
   */
  async pause(allocationId: string): Promise<void> {
    await this.client.post(`/api/budget/allocation/${allocationId}/pause`);
  }

  /**
   * Resume a paused allocation
   */
  async resume(allocationId: string): Promise<void> {
    await this.client.post(`/api/budget/allocation/${allocationId}/resume`);
  }

  /**
   * Get allocation status
   */
  async getAllocation(allocationId: string): Promise<BudgetAllocation> {
    return this.client.get<BudgetAllocation>(
      `/api/budget/allocation/${allocationId}`
    );
  }

  /**
   * List allocations for workspace
   */
  async listAllocations(workspaceId: string, opts?: {
    status?: string;
    limit?: number;
  }): Promise<{ allocations: BudgetAllocation[]; total: number }> {
    return this.client.get('/api/budget/allocations', {
      query: { workspaceId, ...opts },
    });
  }

  /**
   * Reconcile allocation (compare planned vs actual spend)
   *
   * @example
   * ```typescript
   * const report = await client.budget.reconcile('alloc_123');
   * console.log('Variance:', report.summary.variance);
   * console.log('Actual ROAS:', report.performance.actualROAS);
   * ```
   */
  async reconcile(allocationId: string): Promise<ReconciliationReport> {
    return this.client.post<ReconciliationReport>(
      `/api/budget/allocation/${allocationId}/reconcile`
    );
  }

  /**
   * Get budget ledger (transaction log)
   */
  async getLedger(
    workspaceId: string,
    range: { from: Date; to: Date }
  ): Promise<BudgetLedger[]> {
    return this.client.get<BudgetLedger[]>('/api/budget/ledger', {
      query: {
        workspaceId,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    });
  }

  /**
   * Get workspace wallet
   */
  async getWallet(workspaceId: string): Promise<Wallet> {
    return this.client.get<Wallet>(`/api/budget/wallet/${workspaceId}`);
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(workspaceId: string): Promise<number> {
    const wallet = await this.getWallet(workspaceId);
    return wallet.balance;
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(
    workspaceId: string,
    opts?: { limit?: number; offset?: number }
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    return this.client.get(`/api/budget/wallet/${workspaceId}/transactions`, {
      query: opts,
    });
  }

  /**
   * Top up wallet via Stripe
   */
  async topUpWallet(
    workspaceId: string,
    amount: number
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    return this.client.post(`/api/budget/wallet/${workspaceId}/topup`, {
      body: { amount },
    });
  }

  /**
   * Configure auto-reload for wallet
   */
  async configureAutoReload(
    workspaceId: string,
    config: {
      enabled: boolean;
      threshold?: number;
      amount?: number;
    }
  ): Promise<Wallet> {
    return this.client.post<Wallet>(
      `/api/budget/wallet/${workspaceId}/auto-reload`,
      {
        body: config,
      }
    );
  }

  /**
   * Get Stripe payment history
   */
  async getPayments(
    workspaceId: string,
    opts?: { limit?: number }
  ): Promise<{ payments: StripePayment[]; total: number }> {
    return this.client.get('/api/budget/payments', {
      query: { workspaceId, ...opts },
    });
  }

  /**
   * Create a budget profile (template)
   */
  async createProfile(
    profile: Omit<BudgetProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BudgetProfile> {
    return this.client.post<BudgetProfile>('/api/budget/profiles', {
      body: profile,
    });
  }

  /**
   * List budget profiles
   */
  async listProfiles(workspaceId: string): Promise<BudgetProfile[]> {
    return this.client.get<BudgetProfile[]>('/api/budget/profiles', {
      query: { workspaceId },
    });
  }

  /**
   * Get budget dashboard data
   */
  async getDashboard(
    workspaceId: string,
    period: { from: Date; to: Date }
  ): Promise<BudgetDashboard> {
    return this.client.get<BudgetDashboard>(
      `/api/budget/dashboard/${workspaceId}`,
      {
        query: {
          from: period.from.toISOString(),
          to: period.to.toISOString(),
        },
      }
    );
  }

  /**
   * Get spend alerts
   */
  async getAlerts(
    workspaceId: string,
    opts?: { acknowledged?: boolean }
  ): Promise<SpendAlert[]> {
    return this.client.get<SpendAlert[]>('/api/budget/alerts', {
      query: { workspaceId, ...opts },
    });
  }

  /**
   * Acknowledge a spend alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.client.post(`/api/budget/alerts/${alertId}/acknowledge`);
  }

  /**
   * Get channel performance history
   */
  async getChannelPerformance(
    workspaceId: string,
    channel: string,
    period: { from: Date; to: Date }
  ) {
    return this.client.get(`/api/budget/performance/${channel}`, {
      query: {
        workspaceId,
        from: period.from.toISOString(),
        to: period.to.toISOString(),
      },
    });
  }
}

