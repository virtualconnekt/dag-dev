/**
 * evm.ts
 * 
 * Helper functions for EVM operations.
 * Convenience wrappers for contract deployment and interaction.
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

import { EVMExecutor, Transaction, LocalNode } from '@dagdev/core';

/**
 * EVM Helper Class
 * Provides convenient methods for EVM interactions
 */
export class EVMHelpers {
  constructor(
    private getEVM: (() => EVMExecutor) | null,
    private node: LocalNode | any
  ) {}

  /**
   * Get the EVM executor (only for LocalNode, not RPC)
   */
  private getEVMExecutor(): EVMExecutor {
    if (!this.getEVM) {
      throw new Error('EVM executor not available (RPC client mode)');
    }
    return this.getEVMExecutor();
  }

  /**
   * Get accounts (works with both LocalNode and RPC)
   */
  async getAccounts(): Promise<string[]> {
    // Check if this is an RPC client
    if (this.node.getAccounts) {
      return await this.node.getAccounts();
    }
    
    // Default local accounts
    return [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
    ];
  }

  /**
   * Deploy a smart contract
   * 
   * @param bytecode - Contract bytecode (hex string with 0x prefix)
   * @param from - Deployer address
   * @param options - Deployment options
   * @returns Contract address and transaction hash
   */
  async deploy(
    bytecode: string,
    from: string = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    options: any = {}
  ): Promise<{
    address: string;
    transactionHash: string;
    gasUsed: bigint;
  }> {
    // Check if this is an RPC client
    if (this.node.deployContract) {
      return await this.node.deployContract(bytecode, from, options);
    }
    
    // Local deployment
    const evm = this.getEVMExecutor();
    const value = options.value || BigInt(0);
    
    // Ensure bytecode has 0x prefix
    if (!bytecode.startsWith('0x')) {
      bytecode = '0x' + bytecode;
    }

    // Create deployment transaction (empty 'to' field)
    const txHash = '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const deployTx: Transaction = {
      hash: txHash,
      from,
      to: '', // Empty = deployment
      value,
      data: bytecode,
      nonce: Number(await evm.getNonce(from)),
      gasLimit: BigInt(options.gasLimit || 5000000),
      gasPrice: BigInt('1000000000')
    };

    // Execute deployment
    const result = await evm.executeTransaction(deployTx, 'latest');
    
    // Add to transaction pool
    this.node.addTransaction(deployTx);
    
    return {
      address: result.createdAddress || '0x0',
      transactionHash: txHash,
      gasUsed: result.gasUsed
    };
  }

  /**
   * Send a transaction (state-changing)
   */
  async sendTransaction(tx: any): Promise<any> {
    // Check if this is an RPC client
    if (this.node.sendTransaction) {
      return await this.node.sendTransaction(tx);
    }
    
    // Local transaction
    const evm = this.getEVMExecutor();
    const txHash = '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const transaction: Transaction = {
      hash: txHash,
      from: tx.from,
      to: tx.to || '',
      value: tx.value || BigInt(0),
      data: tx.data || '0x',
      nonce: Number(await evm.getNonce(tx.from)),
      gasLimit: BigInt(tx.gasLimit || 21000),
      gasPrice: BigInt(tx.gasPrice || '1000000000')
    };

    await evm.executeTransaction(transaction, 'latest');
    this.node.addTransaction(transaction);
    
    return {
      hash: txHash
    };
  }

  /**
   * Call a contract method (read-only, no state change)
   * 
   * @param params - Call parameters
   * @returns Return data from the call
   */
  async call(params: any): Promise<string> {
    // Check if this is an RPC client
    if (this.node.callContract) {
      return await this.node.callContract(params);
    }
    
    // Local call
    const evm = this.getEVMExecutor();
    const result = await evm.call(
      params.to,
      params.data || '0x',
      params.from,
      params.value
    );
    
    // Convert Uint8Array to hex string
    return '0x' + Buffer.from(result).toString('hex');
  }

  /**
   * Get the balance of an address
   * 
   * @param address - Address to check
   * @returns Balance in wei
   */
  async getBalance(address: string): Promise<bigint> {
    const evm = this.getEVMExecutor();
    return evm.getBalance(address);
  }

  /**
   * Set the balance of an address (for testing)
   * 
   * @param address - Address to fund
   * @param balance - Balance in wei
   */
  async setBalance(address: string, balance: bigint): Promise<void> {
    const evm = this.getEVMExecutor();
    await evm.setBalance(address, balance);
  }

  /**
   * Get the nonce of an address
   * 
   * @param address - Address to check
   * @returns Current nonce
   */
  async getNonce(address: string): Promise<number> {
    const evm = this.getEVMExecutor();
    return Number(evm.getNonce(address));
  }

  /**
   * Get the code of a contract
   * 
   * @param address - Contract address
   * @returns Contract bytecode
   */
  async getCode(address: string): Promise<string> {
    const evm = this.getEVMExecutor();
    const code = await evm.getCode(address);
    return '0x' + Buffer.from(code).toString('hex');
  }

  /**
   * Get storage at a position
   * 
   * @param address - Contract address
   * @param position - Storage position
   * @returns Storage value
   */
  async getStorageAt(address: string, position: string): Promise<string> {
    const evm = this.getEVMExecutor();
    const value = await evm.getStorageAt(address, position);
    return '0x' + Buffer.from(value).toString('hex');
  }

  /**
   * Estimate gas for a transaction
   * 
   * @param tx - Transaction to estimate
   * @returns Estimated gas
   */
  async estimateGas(tx: Partial<Transaction>): Promise<bigint> {
    const evm = this.getEVMExecutor();
    
    const fullTx: Transaction = {
      hash: '0x0',
      from: tx.from || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      to: tx.to || '',
      value: tx.value || BigInt(0),
      data: tx.data || '0x',
      nonce: tx.nonce ?? 0,
      gasLimit: tx.gasLimit || BigInt(21000),
      gasPrice: tx.gasPrice || BigInt('1000000000')
    };
    
    return evm.estimateGas(fullTx);
  }

  /**
   * Get transaction receipt
   * 
   * @param txHash - Transaction hash
   * @returns Receipt or undefined
   */
  async getTransactionReceipt(txHash: string) {
    const miner = this.node.getMiner();
    return miner.getReceipt(txHash);
  }

  /**
   * Get current state root
   * 
   * @returns State root hash
   */
  async getStateRoot(): Promise<string> {
    const evm = this.getEVMExecutor();
    return evm.getStateRootHex();
  }

  /**
   * Create a checkpoint (for testing - allows revert)
   */
  async checkpoint(): Promise<void> {
    const evm = this.getEVMExecutor();
    await evm.checkpoint();
  }

  /**
   * Commit a checkpoint
   */
  async commit(): Promise<void> {
    const evm = this.getEVMExecutor();
    await evm.commit();
  }

  /**
   * Revert to last checkpoint
   */
  async revert(): Promise<void> {
    const evm = this.getEVMExecutor();
    await evm.revert();
  }

  /**
   * Helper: Parse ETH amount to wei
   * 
   * @param eth - Amount in ETH (string or number)
   * @returns Amount in wei
   */
  parseEther(eth: string | number): bigint {
    const ethStr = typeof eth === 'number' ? eth.toString() : eth;
    const [whole, decimal = ''] = ethStr.split('.');
    const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
    return BigInt(whole + paddedDecimal);
  }

  /**
   * Helper: Format wei to ETH string
   * 
   * @param wei - Amount in wei
   * @returns Amount in ETH as string
   */
  formatEther(wei: bigint): string {
    const weiStr = wei.toString().padStart(19, '0');
    const whole = weiStr.slice(0, -18) || '0';
    const decimal = weiStr.slice(-18).replace(/0+$/, '') || '0';
    return `${whole}.${decimal}`;
  }

  /**
   * Create multiple test accounts with balances
   * 
   * @param count - Number of accounts to create
   * @param balance - Balance for each account (default: 10 ETH)
   * @returns Array of account addresses
   */
  async createTestAccounts(count: number = 10, balance: bigint = BigInt('10000000000000000000')): Promise<string[]> {
    const accounts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a deterministic address
      const address = '0x' + (i + 1).toString(16).padStart(40, '0');
      await this.setBalance(address, balance);
      accounts.push(address);
    }
    
    return accounts;
  }
}
