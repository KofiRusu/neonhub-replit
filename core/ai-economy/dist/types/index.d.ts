export interface Token {
    id: string;
    symbol: string;
    name: string;
    totalSupply: number;
    circulatingSupply: number;
    decimals: number;
    contractAddress?: string;
    blockchain: 'ethereum' | 'polygon' | 'solana' | 'internal';
    createdAt: Date;
    updatedAt: Date;
}
export interface TokenBalance {
    tokenId: string;
    holderId: string;
    balance: number;
    lockedBalance: number;
    lastTransaction: Date;
}
export interface Transaction {
    id: string;
    type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake' | 'reward';
    fromAddress: string;
    toAddress: string;
    tokenId: string;
    amount: number;
    fee: number;
    gasPrice?: number;
    gasLimit?: number;
    transactionHash?: string;
    blockNumber?: number;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: Date;
    metadata: Record<string, any>;
}
export interface PricingModel {
    id: string;
    tokenId: string;
    modelType: 'fixed' | 'dynamic' | 'auction' | 'dutch';
    basePrice: number;
    currentPrice: number;
    minPrice: number;
    maxPrice: number;
    adjustmentFactor: number;
    lastAdjustment: Date;
    parameters: Record<string, any>;
}
export interface MarketData {
    tokenId: string;
    price: number;
    volume24h: number;
    marketCap: number;
    priceChange24h: number;
    priceChange7d: number;
    liquidity: number;
    timestamp: Date;
}
export interface EconomicMetrics {
    totalValueLocked: number;
    totalTransactions: number;
    activeUsers: number;
    transactionVolume24h: number;
    averageTransactionFee: number;
    marketEfficiency: number;
    inflationRate: number;
    timestamp: Date;
}
export interface GovernanceProposal {
    id: string;
    title: string;
    description: string;
    proposer: string;
    type: 'parameter_change' | 'funding' | 'protocol_upgrade' | 'emergency';
    status: 'draft' | 'active' | 'passed' | 'failed' | 'executed';
    startTime: Date;
    endTime: Date;
    quorum: number;
    approvalThreshold: number;
    votesFor: number;
    votesAgainst: number;
    abstainVotes: number;
    executionTime?: Date;
    executed: boolean;
}
export interface GovernanceVote {
    proposalId: string;
    voter: string;
    choice: 'for' | 'against' | 'abstain';
    weight: number;
    timestamp: Date;
    transactionHash?: string;
}
export interface EconomicAgent {
    id: string;
    type: 'user' | 'service' | 'federation_node' | 'market_maker';
    reputation: number;
    stake: number;
    rewards: number;
    penalties: number;
    lastActivity: Date;
    status: 'active' | 'inactive' | 'suspended';
}
export interface RewardPool {
    id: string;
    name: string;
    totalRewards: number;
    remainingRewards: number;
    distributionRate: number;
    criteria: Record<string, any>;
    startTime: Date;
    endTime?: Date;
    active: boolean;
}
export interface StakingPool {
    id: string;
    tokenId: string;
    totalStaked: number;
    minStake: number;
    lockPeriod: number;
    apr: number;
    rewardsDistributed: number;
    participants: number;
    active: boolean;
}
export interface EconomicConfig {
    baseCurrency: string;
    inflationRate: number;
    transactionFeeRate: number;
    stakingRewardRate: number;
    governanceQuorum: number;
    maxSupply?: number;
    burnRate: number;
    redistributionRate: number;
}
//# sourceMappingURL=index.d.ts.map