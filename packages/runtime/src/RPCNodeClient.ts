/**
 * RPCNodeClient.ts
 * 
 * RPC client that wraps a remote node and provides a LocalNode-like interface.
 * This allows DagRuntime to work with both local and remote nodes transparently.
 * 
 * @phase Phase 7 - CLI Tool (Remote Node Support)
 */

import { Block } from '@dagdev/core';
import { LegacyTransaction } from '@ethereumjs/tx';
import { Common } from '@ethereumjs/common';
import { AccountManager } from './AccountManager';

interface RPCResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Mock DAG that fetches data via RPC
 */
class RPCDAGGraph {
  constructor(private rpcUrl: string) {}

  async rpc(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });
    
    const data = await response.json() as RPCResponse;
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    return data.result;
  }

  getMaxDepth(): number {
    // This would need to be async in a real implementation
    return 0;
  }

  getStats() {
    return {
      totalBlocks: 0,
      blueBlocks: 0,
      redBlocks: 0,
      tips: 0,
      maxDepth: 0
    };
  }

  getAllBlocks(): Block[] {
    return [];
  }

  getBlock(_hash: string): Block | undefined {
    return undefined;
  }

  getTips(): string[] {
    return [];
  }
}

/**
 * Mock Miner that sends transactions via RPC
 */
class RPCMiner {
  constructor(private rpcUrl: string) {}

  async rpc(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });
    
    const data = await response.json() as RPCResponse;
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    return data.result;
  }

  getConfig() {
    return {
      parallelism: 3,
      blockTime: 2000,
      maxParents: 3,
      minerAddress: '0xMiner'
    };
  }

  startMining(): void {
    // RPC command to start mining
  }

  stopMining(): void {
    // RPC command to stop mining
  }

  isMining(): boolean {
    return false;
  }

  getBlocksMinedCount(): number {
    return 0;
  }

  getEVMExecutor(): any {
    return {
      // RPC-based EVM methods
      executeTransaction: async (tx: any) => {
        const txHash = await this.rpc('eth_sendTransaction', [tx]);
        return {
          receipt: {
            transactionHash: txHash,
            status: '0x1',
            gasUsed: '0x5208'
          }
        };
      },
      call: async (to: string, data: string, from?: string) => {
        const result = await this.rpc('eth_call', [{
          to,
          data,
          from: from || '0x0000000000000000000000000000000000000000'
        }, 'latest']);
        return result;
      },
      getNonce: async (address: string) => {
        const nonce = await this.rpc('eth_getTransactionCount', [address, 'latest']);
        return nonce;
      }
    };
  }

  /**
   * Get test accounts via RPC
   */
  async getAccounts(): Promise<string[]> {
    return await this.rpc('eth_accounts', []);
  }

  /**
   * Deploy a contract via RPC
   */
  async deployContract(bytecode: string, from: string, options: any = {}): Promise<any> {
    // Ensure bytecode has 0x prefix
    if (!bytecode.startsWith('0x')) {
      bytecode = '0x' + bytecode;
    }

    // Send deployment transaction
    const txHash = await this.rpc('eth_sendTransaction', [{
      from,
      data: bytecode,
      gas: options.gasLimit ? '0x' + options.gasLimit.toString(16) : '0x4c4b40', // 5000000
      gasPrice: '0x3b9aca00' // 1 gwei
    }]);

    // Wait for receipt
    let receipt = null;
    for (let i = 0; i < 50; i++) {
      receipt = await this.rpc('eth_getTransactionReceipt', [txHash]);
      if (receipt) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    return {
      address: receipt.contractAddress,
      transactionHash: txHash,
      gasUsed: BigInt(receipt.gasUsed)
    };
  }

  /**
   * Send a transaction via RPC
   */
  async sendTransaction(tx: any): Promise<any> {
    const txHash = await this.rpc('eth_sendTransaction', [{
      from: tx.from,
      to: tx.to,
      data: tx.data,
      gas: tx.gasLimit ? '0x' + tx.gasLimit.toString(16) : undefined,
      gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : undefined,
      value: tx.value ? '0x' + tx.value.toString(16) : undefined
    }]);

    return {
      hash: txHash
    };
  }

  /**
   * Call a contract method (read-only)
   */
  async callContract(params: any): Promise<string> {
    return await this.rpc('eth_call', [params, 'latest']);
  }
}

/**
 * RPC Node Client
 * Provides a LocalNode-compatible interface but communicates with a remote node via RPC
 */
export class RPCNodeClient {
  private rpcUrl: string;
  private dag: RPCDAGGraph;
  private miner: RPCMiner;
  private accountManager?: AccountManager;
  private chainId?: number;

  constructor(options: { rpcUrl: string; wsUrl?: string; accountManager?: AccountManager; chainId?: number }) {
    this.rpcUrl = options.rpcUrl;
    this.dag = new RPCDAGGraph(this.rpcUrl);
    this.miner = new RPCMiner(this.rpcUrl);
    this.accountManager = options.accountManager;
    this.chainId = options.chainId;
  }

  /**
   * Test connection to the node
   */
  async connect(): Promise<void> {
    try {
      await this.rpc('eth_blockNumber', []);
    } catch (error) {
      throw new Error(`Failed to connect to node at ${this.rpcUrl}: ${error}`);
    }
  }

  /**
   * Make an RPC call
   */
  async rpc(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as RPCResponse;
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    return data.result;
  }

  /**
   * Get the DAG instance (mock for RPC)
   */
  getDAG(): any {
    return this.dag;
  }

  /**
   * Get the Miner instance (mock for RPC)
   */
  getMiner(): any {
    return this.miner;
  }

  /**
   * Get node statistics
   */
  getStats() {
    return {
      dag: {
        totalBlocks: 0,
        blueBlocks: 0,
        redBlocks: 0,
        tips: 0,
        maxDepth: 0
      },
      txPool: {
        totalTransactions: 0,
        maxSize: 1000,
        utilization: '0%'
      },
      miner: {
        isRunning: true,
        blocksMined: 0,
        config: this.miner.getConfig()
      },
      node: {
        isRunning: true,
        port: 8545,
        wsPort: 8546
      }
    };
  }

  /**
   * Check if node is running
   */
  isNodeRunning(): boolean {
    return true;
  }

  /**
   * Get test accounts via RPC
   */
  async getAccounts(): Promise<string[]> {
    // If we have an account manager, return those accounts
    if (this.accountManager && this.accountManager.hasAccounts()) {
      return this.accountManager.getAddresses();
    }
    
    // Otherwise, ask the RPC node
    return await this.rpc('eth_accounts', []);
  }

  /**
   * Sign and send a raw transaction
   */
  private async signAndSendTransaction(txData: any, from: string): Promise<string> {
    if (!this.accountManager) {
      throw new Error('No account manager available for signing transactions');
    }

    const privateKey = this.accountManager.getPrivateKey(from);
    if (!privateKey) {
      throw new Error(`No private key found for address ${from}`);
    }

    // Get nonce
    const nonce = await this.rpc('eth_getTransactionCount', [from, 'latest']);
    
    // Get gas price if not provided
    let gasPrice = txData.gasPrice;
    if (!gasPrice) {
      gasPrice = await this.rpc('eth_gasPrice', []);
    }

    // Build transaction object
    const txParams = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: txData.gas || txData.gasLimit || '0x4c4b40', // 5000000
      to: txData.to || undefined,
      value: txData.value || '0x0',
      data: txData.data || '0x',
    };

    // Create common object for the chain
    const common = Common.custom({
      chainId: this.chainId || 1,
      networkId: this.chainId || 1,
    });

    // Sign transaction
    const tx = LegacyTransaction.fromTxData(txParams, { common });
    const privateKeyBuffer = Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex');
    const signedTx = tx.sign(privateKeyBuffer);
    const serializedTx = '0x' + Buffer.from(signedTx.serialize()).toString('hex');

    // Send raw transaction
    return await this.rpc('eth_sendRawTransaction', [serializedTx]);
  }

  /**
   * Deploy a contract via RPC
   */
  async deployContract(bytecode: string, from: string, options: any = {}): Promise<any> {
    // Ensure bytecode has 0x prefix
    if (!bytecode.startsWith('0x')) {
      bytecode = '0x' + bytecode;
    }

    let txHash: string;

    // If we have an account manager, sign the transaction
    if (this.accountManager && this.accountManager.hasAccounts()) {
      txHash = await this.signAndSendTransaction({
        data: bytecode,
        gas: options.gasLimit ? '0x' + options.gasLimit.toString(16) : undefined,
        gasPrice: options.gasPrice,
      }, from);
    } else {
      // Send deployment transaction (unsigned, node will sign)
      txHash = await this.rpc('eth_sendTransaction', [{
        from,
        data: bytecode,
        gas: options.gasLimit ? '0x' + options.gasLimit.toString(16) : '0x4c4b40', // 5000000
        gasPrice: '0x3b9aca00' // 1 gwei
      }]);
    }

    // Wait for receipt (increased timeout for slow testnets)
    let receipt = null;
    const maxAttempts = 120; // 120 attempts × 1000ms = 2 minutes
    for (let i = 0; i < maxAttempts; i++) {
      receipt = await this.rpc('eth_getTransactionReceipt', [txHash]);
      if (receipt) break;
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between attempts
    }

    if (!receipt) {
      // Return partial result with transaction hash even if receipt not found
      console.warn(`⚠️  Receipt not found after ${maxAttempts} seconds, but transaction was submitted`);
      return {
        address: null,
        transactionHash: txHash,
        gasUsed: null,
        status: 'pending'
      };
    }

    return {
      address: receipt.contractAddress,
      transactionHash: txHash,
      gasUsed: BigInt(receipt.gasUsed)
    };
  }

  /**
   * Send a transaction via RPC
   */
  async sendTransaction(tx: any): Promise<any> {
    const txHash = await this.rpc('eth_sendTransaction', [{
      from: tx.from,
      to: tx.to,
      data: tx.data,
      gas: tx.gasLimit ? '0x' + tx.gasLimit.toString(16) : undefined,
      gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : undefined,
      value: tx.value ? '0x' + tx.value.toString(16) : undefined
    }]);

    return {
      hash: txHash
    };
  }

  /**
   * Call a contract method (read-only)
   */
  async callContract(params: any): Promise<string> {
    return await this.rpc('eth_call', [params, 'latest']);
  }
}
