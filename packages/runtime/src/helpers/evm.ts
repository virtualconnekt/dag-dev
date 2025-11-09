/**
 * evm.ts
 * 
 * Helper functions for EVM operations.
 * Convenience wrappers for contract deployment and interaction.
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

import { EVMExecutor } from '@dagdev/core/src/evm/EVMExecutor';
import { Transaction } from '@dagdev/core/src/dag/Block';
import { LocalNode } from '@dagdev/core/src/network/LocalNode';

/**
 * EVM Helper Class
 * Provides convenient methods for EVM interactions
 */
export class EVMHelpers {
  constructor(
    private getEVM: () => EVMExecutor,
    private node: LocalNode
  ) {}

  /**
   * Deploy a smart contract
   * 
   * @param bytecode - Contract bytecode (hex string with 0x prefix)
   * @param from - Deployer address
   * @param value - ETH to send with deployment (default: 0)
   * @returns Contract address and transaction hash
   */
  async deploy(
    bytecode: string,
    from: string = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    value: bigint = BigInt(0)
  ): Promise<{
    address: string;
    transactionHash: string;
    gasUsed: bigint;
  }> {
    const evm = this.getEVM();
    
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
      gasLimit: BigInt(5000000),
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
   * Call a contract method (read-only, no state change)
   * 
   * @param to - Contract address
   * @param data - Encoded function call data
   * @param from - Caller address
   * @param value - ETH to send
   * @returns Return data from the call
   */
  async call(
    to: string,
    data: string = '0x',
    from?: string,
    value?: bigint
  ): Promise<string> {
    const evm = this.getEVM();
    const result = await evm.call(to, data, from, value);
    
    // Convert Uint8Array to hex string
    return '0x' + Buffer.from(result).toString('hex');
  }

  /**
   * Send a transaction (state-changing)
   * 
   * @param tx - Transaction object
   * @returns Transaction hash
   */
  async sendTransaction(tx: Partial<Transaction>): Promise<string> {
    // Generate transaction hash
    const txHash = '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const fullTx: Transaction = {
      hash: txHash,
      from: tx.from || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      to: tx.to || '',
      value: tx.value || BigInt(0),
      data: tx.data || '0x',
      nonce: tx.nonce ?? 0,
      gasLimit: tx.gasLimit || BigInt(200000),
      gasPrice: tx.gasPrice || BigInt('1000000000')
    };

    // Add to transaction pool
    this.node.addTransaction(fullTx);
    
    return txHash;
  }

  /**
   * Get the balance of an address
   * 
   * @param address - Address to check
   * @returns Balance in wei
   */
  async getBalance(address: string): Promise<bigint> {
    const evm = this.getEVM();
    return evm.getBalance(address);
  }

  /**
   * Set the balance of an address (for testing)
   * 
   * @param address - Address to fund
   * @param balance - Balance in wei
   */
  async setBalance(address: string, balance: bigint): Promise<void> {
    const evm = this.getEVM();
    await evm.setBalance(address, balance);
  }

  /**
   * Get the nonce of an address
   * 
   * @param address - Address to check
   * @returns Current nonce
   */
  async getNonce(address: string): Promise<number> {
    const evm = this.getEVM();
    return Number(evm.getNonce(address));
  }

  /**
   * Get the code of a contract
   * 
   * @param address - Contract address
   * @returns Contract bytecode
   */
  async getCode(address: string): Promise<string> {
    const evm = this.getEVM();
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
    const evm = this.getEVM();
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
    const evm = this.getEVM();
    
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
    const evm = this.getEVM();
    return evm.getStateRootHex();
  }

  /**
   * Create a checkpoint (for testing - allows revert)
   */
  async checkpoint(): Promise<void> {
    const evm = this.getEVM();
    await evm.checkpoint();
  }

  /**
   * Commit a checkpoint
   */
  async commit(): Promise<void> {
    const evm = this.getEVM();
    await evm.commit();
  }

  /**
   * Revert to last checkpoint
   */
  async revert(): Promise<void> {
    const evm = this.getEVM();
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
