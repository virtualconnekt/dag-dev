/**
 * Miner.ts
 * 
 * Simulates parallel block mining in a BlockDAG network.
 * Unlike traditional blockchain mining (sequential), DAG mining
 * allows multiple blocks to be created simultaneously.
 * 
 * Features:
 * - Parallel block creation (configurable parallelism)
 * - Smart parent selection from DAG tips
 * - Mining intervals (block time simulation)
 * - Transaction inclusion from mempool
 * 
 * This is a simulator - no real proof-of-work is performed.
 * 
 * @phase Phase 2 - Mining Simulation
 */

import { DAGGraph } from './DAGGraph';
import { Block, Transaction } from './Block';
import { EVMExecutor, TransactionReceipt } from '../evm/EVMExecutor';
import EventEmitter from 'events';

export interface MinerConfig {
  parallelism: number;      // Number of blocks to mine per round
  blockTime: number;        // Time between mining rounds (ms)
  maxParents: number;       // Maximum parents per block
  minerAddress: string;     // Miner's reward address
}

export class Miner extends EventEmitter {
  private dag: DAGGraph;
  private config: MinerConfig;
  private mining: boolean;
  private miningInterval: NodeJS.Timeout | null;
  private txPool: any; // Will be replaced with TransactionPool
  private blocksMinedCount: number;
  private evmExecutor: EVMExecutor;
  private receipts: Map<string, TransactionReceipt>; // txHash -> receipt

  constructor(dag: DAGGraph, config: Partial<MinerConfig> = {}) {
    super();
    this.dag = dag;
    this.config = {
      parallelism: config.parallelism || 3,
      blockTime: config.blockTime || 2000,
      maxParents: config.maxParents || 3,
      minerAddress: config.minerAddress || '0xMinerAddress',
    };
    this.mining = false;
    this.miningInterval = null;
    this.txPool = null;
    this.blocksMinedCount = 0;
    this.evmExecutor = new EVMExecutor();
    this.receipts = new Map();
    
    console.log('[Miner] Initialized with EVM executor');
  }

  /**
   * Set transaction pool reference
   * Used to pull transactions for new blocks
   */
  setTransactionPool(txPool: any): void {
    this.txPool = txPool;
  }

  /**
   * Start mining loop
   * Creates blocks at regular intervals
   */
  startMining(): void {
    if (this.mining) {
      console.log('[Miner] Already mining');
      return;
    }

    this.mining = true;
    console.log(`[Miner] Starting mining - ${this.config.parallelism} blocks every ${this.config.blockTime}ms`);

    // Immediate first mining round (async, fire and forget)
    this.mineRound().catch(error => {
      console.error('[Miner] Error in mining round:', error);
    });

    // Schedule subsequent rounds
    this.miningInterval = setInterval(() => {
      this.mineRound().catch(error => {
        console.error('[Miner] Error in mining round:', error);
      });
    }, this.config.blockTime);

    this.emit('miningStarted');
  }

  /**
   * Stop mining
   */
  stopMining(): void {
    if (!this.mining) {
      console.log('[Miner] Not currently mining');
      return;
    }

    this.mining = false;

    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }

    console.log('[Miner] Mining stopped');
    this.emit('miningStopped');
  }

  /**
   * Mine a round of parallel blocks
   * Creates multiple blocks simultaneously (all reference the same tips)
   * This creates the DAG structure with multiple branches
   */
  private async mineRound(): Promise<void> {
    console.log(`\n[Miner] Mining round started - creating ${this.config.parallelism} blocks`);

    const minedBlocks: Block[] = [];
    
    // CRITICAL: Capture tips ONCE before mining
    // All blocks in this round will reference the SAME tips
    // This creates parallel branches instead of a chain
    const currentTips = this.dag.getTips();

    // Mine multiple blocks in parallel
    for (let i = 0; i < this.config.parallelism; i++) {
      try {
        // Select parents for this block (using captured tips)
        const parents = this.selectParentsFromTips(currentTips, i);

        // Get transactions from pool (if available)
        const transactions = this.getTransactionsFromPool();

        // Mine the block (now async with EVM execution)
        const block = await this.mineBlock(transactions, parents);

        // Store block temporarily (don't add to DAG yet)
        minedBlocks.push(block);
        console.log(`  [Miner] ⛏️  Block ${i + 1} created: ${block.header.hash.substring(0, 8)}... (parents: ${parents.length}, stateRoot: ${block.header.stateRoot.substring(0, 10)}...)`);
      } catch (error) {
        console.error(`  [Miner] ✗ Failed to mine block ${i + 1}:`, error);
      }
    }

    // Now add ALL blocks to DAG at once
    // This ensures they all reference the same tips (parallel mining)
    for (const block of minedBlocks) {
      try {
        const added = this.dag.addBlock(block);
        if (added) {
          this.blocksMinedCount++;
          console.log(`  [Miner] ✓ Block added: ${block.header.hash.substring(0, 8)}... depth=${block.dagDepth} color=${block.color}`);
        }
      } catch (error) {
        console.error(`  [Miner] ✗ Failed to add block:`, error);
      }
    }

    // Emit events for all mined blocks
    for (const block of minedBlocks) {
      this.emit('blockMined', block);
    }

    // Log DAG stats
    const stats = this.dag.getStats();
    console.log(`[Miner] DAG Stats: ${stats.totalBlocks} blocks, ${stats.blueBlocks} blue, ${stats.redBlocks} red, ${stats.tips} tips, depth ${stats.maxDepth}`);
  }

  /**
   * Mine a single block with EVM transaction execution
   * @param transactions - Transactions to include
   * @param parentHashes - Parent block hashes
   */
  async mineBlock(transactions: Transaction[], parentHashes: string[]): Promise<Block> {
    // Reset cumulative gas for new block
    this.evmExecutor.resetCumulativeGas();
    
    // Execute all transactions through EVM
    const blockHash = this.generateTempBlockHash(parentHashes);
    const executedTransactions: Transaction[] = [];
    
    for (const tx of transactions) {
      try {
        // Execute transaction through EVM
        const result = await this.evmExecutor.executeTransaction(tx, blockHash);
        
        // Store receipt
        this.receipts.set(tx.hash, result.receipt);
        
        // Include transaction in block
        executedTransactions.push(tx);
        
        console.log(`    [EVM] Tx ${tx.hash.substring(0, 8)}... executed: ${result.receipt.status}, gas: ${result.receipt.gasUsed}`);
      } catch (error: any) {
        console.error(`    [EVM] Tx ${tx.hash.substring(0, 8)}... failed:`, error.message);
        // Skip failed transactions
      }
    }
    
    // Get state root after executing all transactions
    const stateRoot = await this.evmExecutor.getStateRootHex();
    
    // Create block with selected parents and executed transactions
    const block = new Block(
      parentHashes,
      executedTransactions,
      this.config.minerAddress
    );
    
    // Set state root in block header
    block.header.stateRoot = stateRoot;
    
    // Recompute hash with state root included
    block.header.hash = block.computeHash();

    return block;
  }
  
  /**
   * Generate temporary block hash for transaction execution
   */
  private generateTempBlockHash(parentHashes: string[]): string {
    return `0xtemp_${Date.now()}_${parentHashes.length}`;
  }

  /**
   * Select parent blocks from given tips
   * Strategy: Each block in a parallel round references different subsets of tips
   * This creates the DAG structure with multiple branches
   * 
   * @param tips - Current DAG tips (captured before mining round)
   * @param blockIndex - Index of block being mined in this round (0, 1, 2, ...)
   * @returns Array of parent block hashes
   */
  private selectParentsFromTips(tips: string[], blockIndex: number): string[] {
    const maxParents = this.config.maxParents;

    if (tips.length === 0) {
      throw new Error('No tips available (should have at least genesis)');
    }

    // If only one tip, all blocks reference it (first round after genesis)
    if (tips.length === 1) {
      return [tips[0]];
    }

    // Strategy for multiple tips:
    // Each block references DIFFERENT subsets of tips to create parallel branches
    // This ensures blocks are truly parallel, not sequential

    const parents: string[] = [];
    const numParents = Math.min(maxParents, tips.length);

    if (blockIndex === 0) {
      // First block: reference first N tips
      for (let i = 0; i < numParents; i++) {
        parents.push(tips[i]);
      }
    } else if (blockIndex === 1 && tips.length >= 2) {
      // Second block: reference different subset
      // Start from second tip, wrap around
      for (let i = 0; i < numParents; i++) {
        const idx = (1 + i) % tips.length;
        parents.push(tips[idx]);
      }
    } else {
      // Other blocks: rotate through tips
      const startIdx = blockIndex % tips.length;
      for (let i = 0; i < numParents; i++) {
        const idx = (startIdx + i) % tips.length;
        parents.push(tips[idx]);
      }
    }

    // Remove duplicates (in case tips.length < numParents)
    return [...new Set(parents)];
  }

  /**
   * Get transactions from transaction pool
   * Returns empty array if no pool is configured
   */
  private getTransactionsFromPool(): Transaction[] {
    if (!this.txPool || typeof this.txPool.getPending !== 'function') {
      return []; // No transactions for now
    }

    // Get pending transactions (will be implemented in TransactionPool)
    return this.txPool.getPending(10); // Get up to 10 transactions
  }

  /**
   * Check if currently mining
   */
  isMining(): boolean {
    return this.mining;
  }

  /**
   * Get total blocks mined by this miner
   */
  getBlocksMinedCount(): number {
    return this.blocksMinedCount;
  }

  /**
   * Get miner configuration
   */
  getConfig(): MinerConfig {
    return { ...this.config };
  }

  /**
   * Update miner configuration
   * Note: Requires restart to take effect
   */
  updateConfig(newConfig: Partial<MinerConfig>): void {
    const wasMining = this.mining;
    
    if (wasMining) {
      this.stopMining();
    }

    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (wasMining) {
      this.startMining();
    }

    console.log('[Miner] Configuration updated:', this.config);
  }

  /**
   * Get transaction receipt by hash
   */
  getReceipt(txHash: string): TransactionReceipt | undefined {
    return this.receipts.get(txHash);
  }

  /**
   * Get all transaction receipts
   */
  getAllReceipts(): Map<string, TransactionReceipt> {
    return new Map(this.receipts);
  }

  /**
   * Get EVM executor instance
   */
  getEVMExecutor(): EVMExecutor {
    return this.evmExecutor;
  }
}
