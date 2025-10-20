import { Token, TokenBalance, Transaction, EconomicConfig } from '../types';
export declare class TokenManager {
    private tokens;
    private balances;
    private config;
    constructor(config: EconomicConfig);
    private initializeNativeToken;
    createToken(tokenData: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>): Token;
    getToken(tokenId: string): Token | undefined;
    getAllTokens(): Token[];
    mintTokens(tokenId: string, amount: number, recipient: string): Transaction;
    burnTokens(tokenId: string, amount: number, holder: string): Transaction;
    transferTokens(tokenId: string, fromAddress: string, toAddress: string, amount: number): Transaction;
    private updateBalance;
    getBalance(tokenId: string, holderId: string): number;
    getAllBalances(holderId: string): TokenBalance[];
    lockTokens(tokenId: string, holderId: string, amount: number): boolean;
    unlockTokens(tokenId: string, holderId: string, amount: number): boolean;
    private calculateTransactionFee;
    getTokenStats(tokenId: string): any;
    private getTokenPrice;
    redistributeTokens(): void;
    private calculateRedistributionAmount;
    private getActiveHolders;
}
//# sourceMappingURL=TokenManager.d.ts.map