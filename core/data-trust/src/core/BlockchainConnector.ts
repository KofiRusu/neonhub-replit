import { ethers } from 'ethers';
import { Web3 } from 'web3';
import {
  BlockchainConfig,
  BlockchainTransaction,
  BlockchainConnectorInterface,
  BlockchainError,
  BlockchainNetwork
} from '../types/index.js';

export class BlockchainConnector implements BlockchainConnectorInterface {
  private provider: ethers.JsonRpcProvider | null = null;
  private web3: Web3 | null = null;
  private signer: ethers.Wallet | null = null;
  private config: BlockchainConfig;
  private connected: boolean = false;

  constructor(config: BlockchainConfig) {
    this.config = config;
  }

  /**
   * Connect to the blockchain network
   */
  async connect(): Promise<void> {
    try {
      // Initialize ethers provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl, this.config.chainId);

      // Initialize Web3 instance
      this.web3 = new Web3(this.config.rpcUrl);

      // Initialize signer if private key is provided
      if (this.config.privateKey) {
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      }

      // Test connection
      await this.provider.getNetwork();
      this.connected = true;
    } catch (error) {
      throw new BlockchainError(
        `Failed to connect to ${this.config.network} network`,
        { originalError: error, network: this.config.network, rpcUrl: this.config.rpcUrl }
      );
    }
  }

  /**
   * Disconnect from the blockchain network
   */
  async disconnect(): Promise<void> {
    this.provider = null;
    this.web3 = null;
    this.signer = null;
    this.connected = false;
  }

  /**
   * Check if connected to the network
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Store a hash on the blockchain
   */
  async storeHash(hash: string, metadata?: Record<string, any>): Promise<BlockchainTransaction> {
    if (!this.connected || !this.signer) {
      throw new BlockchainError('Not connected to blockchain or no signer available');
    }

    try {
      const contractAddress = this.config.contractAddress;
      if (!contractAddress) {
        throw new BlockchainError('Contract address not configured');
      }

      // Prepare transaction data
      const data = this.encodeStoreHashData(hash, metadata);

      // Estimate gas
      const gasEstimate = await this.provider!.estimateGas({
        to: contractAddress,
        data,
        from: this.signer.address
      });

      // Send transaction
      const tx = await this.signer.sendTransaction({
        to: contractAddress,
        data,
        gasLimit: this.config.gasLimit || (gasEstimate * 120n / 100n), // 20% buffer
        gasPrice: this.config.gasPrice
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt) {
        throw new BlockchainError('Transaction receipt is null');
      }

      return this.formatTransaction(receipt);
    } catch (error) {
      throw new BlockchainError(
        'Failed to store hash on blockchain',
        { originalError: error, hash, metadata }
      );
    }
  }

  /**
   * Verify a hash against blockchain records
   */
  async verifyHash(hash: string, txHash: string): Promise<boolean> {
    if (!this.connected) {
      throw new BlockchainError('Not connected to blockchain');
    }

    try {
      const tx = await this.getTransaction(txHash);
      if (!tx.status) {
        return false;
      }

      // Decode transaction data to extract stored hash
      const storedHash = this.decodeStoredHash(tx.data);
      return storedHash === hash;
    } catch (error) {
      throw new BlockchainError(
        'Failed to verify hash on blockchain',
        { originalError: error, hash, txHash }
      );
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<BlockchainTransaction> {
    if (!this.connected) {
      throw new BlockchainError('Not connected to blockchain');
    }

    try {
      const receipt = await this.provider!.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new BlockchainError(`Transaction not found: ${txHash}`);
      }

      const tx = await this.provider!.getTransaction(txHash);
      if (!tx) {
        throw new BlockchainError(`Transaction not found: ${txHash}`);
      }

      return this.formatTransactionFromReceipt(tx, receipt);
    } catch (error) {
      throw new BlockchainError(
        'Failed to get transaction',
        { originalError: error, txHash }
      );
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{ chainId: number; blockNumber: number }> {
    if (!this.connected) {
      throw new BlockchainError('Not connected to blockchain');
    }

    try {
      const network = await this.provider!.getNetwork();
      const blockNumber = await this.provider!.getBlockNumber();

      return {
        chainId: Number(network.chainId),
        blockNumber
      };
    } catch (error) {
      throw new BlockchainError(
        'Failed to get network info',
        { originalError: error }
      );
    }
  }

  /**
   * Get network-specific configuration
   */
  static getNetworkConfig(network: BlockchainNetwork): Partial<BlockchainConfig> {
    const configs: Record<BlockchainNetwork, Partial<BlockchainConfig>> = {
      ethereum: {
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
      },
      polygon: {
        chainId: 137,
        rpcUrl: 'https://polygon-rpc.com'
      },
      bsc: {
        chainId: 56,
        rpcUrl: 'https://bsc-dataseed.binance.org'
      },
      arbitrum: {
        chainId: 42161,
        rpcUrl: 'https://arb1.arbitrum.io/rpc'
      },
      optimism: {
        chainId: 10,
        rpcUrl: 'https://mainnet.optimism.io'
      },
      avalanche: {
        chainId: 43114,
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
      },
      fantom: {
        chainId: 250,
        rpcUrl: 'https://rpc.ftm.tools'
      },
      cronos: {
        chainId: 25,
        rpcUrl: 'https://evm.cronos.org'
      }
    };

    return configs[network] || {};
  }

  /**
   * Encode data for storing hash on blockchain
   */
  private encodeStoreHashData(hash: string, metadata?: Record<string, any>): string {
    // This is a simplified implementation
    // In a real implementation, you'd use a proper contract ABI
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'string'],
      [hash, metadata ? JSON.stringify(metadata) : '']
    );

    // Function signature for storeHash(bytes32,string)
    const functionSignature = '0x6b5c7e8f';
    return functionSignature + data.slice(2);
  }

  /**
   * Decode stored hash from transaction data
   */
  private decodeStoredHash(data: string | undefined): string {
    if (!data) return '';

    try {
      // Remove function signature and decode
      const encodedData = '0x' + data.slice(10);
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['bytes32', 'string'], encodedData);
      return decoded[0];
    } catch (error) {
      return '';
    }
  }

  /**
   * Format transaction from receipt
   */
  private formatTransaction(receipt: ethers.TransactionReceipt): BlockchainTransaction {
    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      timestamp: new Date(), // Would need to get from block
      from: receipt.from,
      to: receipt.to || '',
      value: 0n, // Would need to get from transaction
      gasUsed: receipt.gasUsed,
      gasPrice: 0n, // Would need to get from transaction
      status: receipt.status === 1,
      data: '' // Would need to get from transaction
    };
  }

  /**
   * Format transaction from receipt and transaction
   */
  private formatTransactionFromReceipt(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt
  ): BlockchainTransaction {
    return {
      hash: tx.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      timestamp: new Date(), // Would need to get block timestamp
      from: tx.from,
      to: tx.to || '',
      value: tx.value,
      gasUsed: receipt.gasUsed,
      gasPrice: tx.gasPrice,
      status: receipt.status === 1,
      data: tx.data
    };
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    if (!this.connected) {
      throw new BlockchainError('Not connected to blockchain');
    }

    try {
      const feeData = await this.provider!.getFeeData();
      return feeData.gasPrice || 0n;
    } catch (error) {
      throw new BlockchainError(
        'Failed to get gas price',
        { originalError: error }
      );
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: {
    to: string;
    data?: string;
    value?: bigint;
  }): Promise<bigint> {
    if (!this.connected) {
      throw new BlockchainError('Not connected to blockchain');
    }

    try {
      return await this.provider!.estimateGas(tx);
    } catch (error) {
      throw new BlockchainError(
        'Failed to estimate gas',
        { originalError: error, tx }
      );
    }
  }
}