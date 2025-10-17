import { Token, TokenBalance, Transaction, EconomicConfig } from '../types';
import { Decimal } from 'decimal.js';

export class TokenManager {
  private tokens: Map<string, Token> = new Map();
  private balances: Map<string, TokenBalance> = new Map();
  private config: EconomicConfig;

  constructor(config: EconomicConfig) {
    this.config = config;
    this.initializeNativeToken();
  }

  private initializeNativeToken(): void {
    const nativeToken: Token = {
      id: 'neon-token',
      symbol: 'NEON',
      name: 'Neon Token',
      totalSupply: 1000000000, // 1 billion
      circulatingSupply: 100000000, // 100 million initially
      decimals: 18,
      blockchain: 'internal',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tokens.set(nativeToken.id, nativeToken);
  }

  public createToken(tokenData: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>): Token {
    const token: Token = {
      ...tokenData,
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tokens.set(token.id, token);
    return token;
  }

  public getToken(tokenId: string): Token | undefined {
    return this.tokens.get(tokenId);
  }

  public getAllTokens(): Token[] {
    return Array.from(this.tokens.values());
  }

  public mintTokens(tokenId: string, amount: number, recipient: string): Transaction {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    // Update total supply
    token.totalSupply += amount;
    token.circulatingSupply += amount;
    token.updatedAt = new Date();

    // Update recipient balance
    this.updateBalance(tokenId, recipient, amount);

    // Create transaction record
    const transaction: Transaction = {
      id: `mint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'mint',
      fromAddress: 'system',
      toAddress: recipient,
      tokenId,
      amount,
      fee: 0,
      status: 'confirmed',
      timestamp: new Date(),
      metadata: { reason: 'token_mint' }
    };

    return transaction;
  }

  public burnTokens(tokenId: string, amount: number, holder: string): Transaction {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    const balance = this.getBalance(tokenId, holder);
    if (balance < amount) {
      throw new Error(`Insufficient balance: ${balance} < ${amount}`);
    }

    // Update total supply
    token.totalSupply -= amount;
    token.circulatingSupply -= amount;
    token.updatedAt = new Date();

    // Update holder balance
    this.updateBalance(tokenId, holder, -amount);

    // Create transaction record
    const transaction: Transaction = {
      id: `burn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'burn',
      fromAddress: holder,
      toAddress: 'system',
      tokenId,
      amount,
      fee: 0,
      status: 'confirmed',
      timestamp: new Date(),
      metadata: { reason: 'token_burn' }
    };

    return transaction;
  }

  public transferTokens(
    tokenId: string,
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Transaction {
    const fromBalance = this.getBalance(tokenId, fromAddress);
    if (fromBalance < amount) {
      throw new Error(`Insufficient balance: ${fromBalance} < ${amount}`);
    }

    const fee = this.calculateTransactionFee(amount);
    const totalDeduction = amount + fee;

    if (fromBalance < totalDeduction) {
      throw new Error(`Insufficient balance including fee: ${fromBalance} < ${totalDeduction}`);
    }

    // Update balances
    this.updateBalance(tokenId, fromAddress, -totalDeduction);
    this.updateBalance(tokenId, toAddress, amount);

    // Create transaction record
    const transaction: Transaction = {
      id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'transfer',
      fromAddress,
      toAddress,
      tokenId,
      amount,
      fee,
      status: 'confirmed',
      timestamp: new Date(),
      metadata: {}
    };

    return transaction;
  }

  private updateBalance(tokenId: string, holderId: string, amount: number): void {
    const balanceKey = `${tokenId}-${holderId}`;
    const existingBalance = this.balances.get(balanceKey);

    if (existingBalance) {
      existingBalance.balance += amount;
      existingBalance.lastTransaction = new Date();
    } else {
      const newBalance: TokenBalance = {
        tokenId,
        holderId,
        balance: amount,
        lockedBalance: 0,
        lastTransaction: new Date()
      };
      this.balances.set(balanceKey, newBalance);
    }
  }

  public getBalance(tokenId: string, holderId: string): number {
    const balanceKey = `${tokenId}-${holderId}`;
    const balance = this.balances.get(balanceKey);
    return balance ? balance.balance : 0;
  }

  public getAllBalances(holderId: string): TokenBalance[] {
    return Array.from(this.balances.values())
      .filter(balance => balance.holderId === holderId);
  }

  public lockTokens(tokenId: string, holderId: string, amount: number): boolean {
    const balanceKey = `${tokenId}-${holderId}`;
    const balance = this.balances.get(balanceKey);

    if (!balance || balance.balance < amount) {
      return false;
    }

    balance.balance -= amount;
    balance.lockedBalance += amount;
    return true;
  }

  public unlockTokens(tokenId: string, holderId: string, amount: number): boolean {
    const balanceKey = `${tokenId}-${holderId}`;
    const balance = this.balances.get(balanceKey);

    if (!balance || balance.lockedBalance < amount) {
      return false;
    }

    balance.lockedBalance -= amount;
    balance.balance += amount;
    return true;
  }

  private calculateTransactionFee(amount: number): number {
    return amount * this.config.transactionFeeRate;
  }

  public getTokenStats(tokenId: string): any {
    const token = this.tokens.get(tokenId);
    if (!token) return null;

    const holders = Array.from(this.balances.values())
      .filter(b => b.tokenId === tokenId && b.balance > 0)
      .length;

    const totalLocked = Array.from(this.balances.values())
      .filter(b => b.tokenId === tokenId)
      .reduce((sum, b) => sum + b.lockedBalance, 0);

    return {
      token,
      holders,
      totalLocked,
      marketCap: token.circulatingSupply * this.getTokenPrice(tokenId),
      price: this.getTokenPrice(tokenId)
    };
  }

  private getTokenPrice(tokenId: string): number {
    // Simplified pricing - in real implementation, this would integrate with market data
    const token = this.tokens.get(tokenId);
    if (!token) return 0;

    // Base price calculation (simplified)
    return 1.0; // $1.00 base price
  }

  public redistributeTokens(): void {
    // Implement token redistribution logic based on economic config
    const redistributionAmount = this.calculateRedistributionAmount();

    if (redistributionAmount > 0) {
      // Distribute to active participants
      const activeHolders = this.getActiveHolders();
      const amountPerHolder = redistributionAmount / activeHolders.length;

      for (const holder of activeHolders) {
        this.mintTokens('neon-token', amountPerHolder, holder);
      }
    }
  }

  private calculateRedistributionAmount(): number {
    const totalSupply = this.tokens.get('neon-token')?.totalSupply || 0;
    return totalSupply * this.config.redistributionRate;
  }

  private getActiveHolders(): string[] {
    // Get holders with recent activity
    const recentActivity = new Date();
    recentActivity.setDate(recentActivity.getDate() - 30); // Last 30 days

    return Array.from(this.balances.values())
      .filter(b => b.lastTransaction > recentActivity)
      .map(b => b.holderId);
  }
}