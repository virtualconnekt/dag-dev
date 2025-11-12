/**
 * DagRuntime.ts
 * 
 * Main Dag Runtime Environment (DRE) interface.
 * Similar to Hardhat Runtime Environment (HRE).
 * 
 * Provides helper methods for:
 * - DAG operations (getDAGDepth, getBlueSet, etc.)
 * - Mining operations (mineParallel, waitForConfirmation)
 * - EVM operations (sendEVM, deploy, call)
 * - Account management (getSigners, getAccounts)
 * 
 * This is the main API developers use in scripts and tests.
 * 
 * Usage:
 * ```typescript
 * import { dagdev } from 'dagdev';
 * 
 * await dagdev.mining.mineParallel(3);
 * const depth = await dagdev.dag.getDepth();
 * ```
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

import { LocalNode } from '@dagdev/core';
import { DAGHelpers } from './helpers/dag';
import { EVMHelpers } from './helpers/evm';
import { MiningHelpers } from './helpers/mining';
import { RPCNodeClient } from './RPCNodeClient';
import { AccountManager } from './AccountManager';

export class DagRuntime {
  private node: LocalNode | RPCNodeClient;
  public dag: DAGHelpers;
  public evm: EVMHelpers;
  public mining: MiningHelpers;

  constructor(node: LocalNode | RPCNodeClient) {
    this.node = node;
    this.dag = new DAGHelpers(() => node.getDAG());
    
    // For RPC clients, pass null as getEVM (they handle EVM ops differently)
    const getEVM = node instanceof RPCNodeClient 
      ? null 
      : () => (node as LocalNode).getMiner().getEVMExecutor();
    
    this.evm = new EVMHelpers(getEVM as any, node as any);
    this.mining = new MiningHelpers(() => node.getMiner(), node as any);
  }

  /**
   * Create a DagRuntime instance by connecting to an existing node via RPC
   * 
   * @param options - Connection options
   * @returns DagRuntime instance
   */
  static async create(options: {
    rpcUrl?: string;
    wsUrl?: string;
    accountManager?: AccountManager;
    chainId?: number;
  }): Promise<DagRuntime> {
    const rpcUrl = options.rpcUrl || 'http://localhost:8545';
    const wsUrl = options.wsUrl || 'ws://localhost:8546';
    
    // Create RPC client to connect to existing node
    const client = new RPCNodeClient({ 
      rpcUrl, 
      wsUrl,
      accountManager: options.accountManager,
      chainId: options.chainId
    });
    
    // Test connection
    await client.connect();
    
    return new DagRuntime(client);
  }

  /**
   * Get the underlying node instance
   */
  getNode(): LocalNode | RPCNodeClient {
    return this.node;
  }

  /**
   * Get network name
   */
  getNetwork(): string {
    return 'local';
  }
}
