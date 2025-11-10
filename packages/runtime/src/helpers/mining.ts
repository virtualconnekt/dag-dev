/**
 * mining.ts
 * 
 * Helper functions for mining operations.
 * Convenience wrappers for block mining and confirmation.
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

import { Miner } from '@dagdev/core/src/dag/Miner';
import { LocalNode } from '@dagdev/core/src/network/LocalNode';
import { Block } from '@dagdev/core/src/dag/Block';

/**
 * Mining Helper Class
 * Provides convenient methods for mining control
 */
export class MiningHelpers {
  constructor(
    private getMiner: () => Miner,
    private node: LocalNode
  ) {}

  /**
   * Mine a single block manually
   * 
   * @returns The mined block
   */
  async mineSingleBlock(): Promise<Block> {
    const miner = this.getMiner();
    const block = await miner['mineBlock']();
    
    if (!block) {
      throw new Error('Failed to mine block');
    }
    
    return block;
  }

  /**
   * Mine multiple parallel blocks
   * 
   * @param count - Number of blocks to mine (default: parallelism setting)
   * @returns Array of mined blocks
   */
  async mineParallel(count?: number): Promise<Block[]> {
    const miner = this.getMiner();
    const dag = this.node.getDAG();
    const config = miner.getConfig();
    const parallelism = count || config.parallelism;
    
    const blocks: Block[] = [];
    const tips = dag.getTips();
    
    // Mine blocks in parallel
    for (let i = 0; i < parallelism; i++) {
      // Get pending transactions from pool
      const txPool = this.node.getTransactionPool();
      const transactions = txPool.getPending().slice(0, 10); // Max 10 txs per block
      
      // Use current tips as parents
      const block = await miner.mineBlock(transactions, tips);
      blocks.push(block);
      
      console.log(`  [MiningHelper] Mined block: ${block.header.hash.substring(0, 8)}...`);
    }
    
    return blocks;
  }

  /**
   * Mine a specific number of blocks (can span multiple rounds)
   * 
   * @param count - Total number of blocks to mine
   * @returns Array of all mined blocks
   */
  async mineBlocks(count: number): Promise<Block[]> {
    const config = this.getMiner().getConfig();
    const parallelism = config.parallelism;
    const rounds = Math.ceil(count / parallelism);
    
    const allBlocks: Block[] = [];
    
    for (let round = 0; round < rounds; round++) {
      const blocksThisRound = Math.min(parallelism, count - allBlocks.length);
      const blocks = await this.mineParallel(blocksThisRound);
      allBlocks.push(...blocks);
    }
    
    return allBlocks;
  }

  /**
   * Mine blocks until a specific DAG depth is reached
   * 
   * @param targetDepth - Target DAG depth
   * @returns Array of mined blocks
   */
  async mineToDepth(targetDepth: number): Promise<Block[]> {
    const dag = this.node.getDAG();
    const blocks: Block[] = [];
    
    while (dag.getMaxDepth() < targetDepth) {
      const newBlocks = await this.mineParallel();
      blocks.push(...newBlocks);
    }
    
    return blocks;
  }

  /**
   * Wait for a transaction to be included in a block
   * 
   * @param txHash - Transaction hash to wait for
   * @param timeout - Maximum time to wait in ms (default: 30000)
   * @returns Block containing the transaction
   */
  async waitForTransaction(txHash: string, timeout: number = 30000): Promise<Block | null> {
    const startTime = Date.now();
    const miner = this.getMiner();
    
    while (Date.now() - startTime < timeout) {
      // Check if receipt exists
      const receipt = miner.getReceipt(txHash);
      if (receipt) {
        // Find the block containing this transaction
        const dag = this.node.getDAG();
        const allBlocks = dag.getAllBlocks();
        
        for (const block of allBlocks) {
          if (block.transactions.some(tx => tx.hash === txHash)) {
            return block;
          }
        }
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }

  /**
   * Wait for a block to be confirmed (in the blue set)
   * 
   * @param blockHash - Block hash to wait for
   * @param timeout - Maximum time to wait in ms (default: 30000)
   * @returns True if confirmed, false if timeout
   */
  async waitForConfirmation(blockHash: string, timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const dag = this.node.getDAG();
    
    while (Date.now() - startTime < timeout) {
      const block = dag.getBlock(blockHash);
      if (block && block.color === 'blue') {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * Start automatic mining
   */
  startMining(): void {
    this.node.startMining();
  }

  /**
   * Stop automatic mining
   */
  stopMining(): void {
    this.node.stopMining();
  }

  /**
   * Check if mining is active
   */
  isMining(): boolean {
    const stats = this.node.getStats();
    return stats.isMining;
  }

  /**
   * Get mining statistics
   */
  getStats(): {
    isMining: boolean;
    parallelism: number;
    totalBlocks: number;
    miningInterval: number;
  } {
    const miner = this.getMiner();
    const stats = this.node.getStats();
    
    return {
      isMining: stats.isMining,
      parallelism: miner['parallelism'],
      totalBlocks: stats.totalBlocks,
      miningInterval: miner['miningInterval']
    };
  }

  /**
   * Set mining interval (ms between rounds)
   * 
   * @param interval - Interval in milliseconds
   */
  setMiningInterval(interval: number): void {
    const miner = this.getMiner();
    miner['miningInterval'] = interval;
    
    // Restart mining if it was active
    if (this.isMining()) {
      this.stopMining();
      this.startMining();
    }
  }

  /**
   * Wait for blocks to be mined (useful in tests)
   * 
   * @param count - Number of blocks to wait for
   * @param timeout - Maximum time to wait in ms
   */
  async waitForBlocks(count: number, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    const startBlocks = this.node.getStats().totalBlocks;
    const targetBlocks = startBlocks + count;
    
    while (Date.now() - startTime < timeout) {
      const currentBlocks = this.node.getStats().totalBlocks;
      if (currentBlocks >= targetBlocks) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for ${count} blocks after ${timeout}ms`);
  }

  /**
   * Mine blocks with specific transactions
   * Ensures transactions are included in the next mining round
   * 
   * @param txHashes - Transaction hashes to include
   * @returns Blocks containing the transactions
   */
  async mineWithTransactions(txHashes: string[]): Promise<Block[]> {
    // Mine one round to include pending transactions
    const blocks = await this.mineParallel();
    
    // Verify all transactions were included
    const includedTxs = new Set<string>();
    for (const block of blocks) {
      for (const tx of block.transactions) {
        includedTxs.add(tx.hash);
      }
    }
    
    // Check if all requested transactions were included
    const missing = txHashes.filter(hash => !includedTxs.has(hash));
    if (missing.length > 0) {
      console.warn(`Some transactions not included: ${missing.join(', ')}`);
    }
    
    return blocks;
  }

  /**
   * Helper: Mine and wait for all blocks to be blue
   * (Useful for testing final state)
   * 
   * @param additionalRounds - Additional rounds to mine for confirmation
   */
  async mineAndConfirm(additionalRounds: number = 2): Promise<void> {
    // Mine additional rounds to ensure all blocks are confirmed (blue)
    for (let i = 0; i < additionalRounds; i++) {
      await this.mineParallel();
    }
  }
}
