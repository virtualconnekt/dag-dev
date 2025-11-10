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

export class DagRuntime {
  private node: LocalNode;
  public dag: DAGHelpers;
  public evm: EVMHelpers;
  public mining: MiningHelpers;

  constructor(node: LocalNode) {
    this.node = node;
    this.dag = new DAGHelpers(() => node.getDAG());
    this.evm = new EVMHelpers(() => node.getMiner().getEVMExecutor(), node);
    this.mining = new MiningHelpers(() => node.getMiner(), node);
  }

  /**
   * Get the underlying node instance
   */
  getNode(): LocalNode {
    return this.node;
  }

  /**
   * Get network name
   */
  getNetwork(): string {
    return 'local';
  }
}
