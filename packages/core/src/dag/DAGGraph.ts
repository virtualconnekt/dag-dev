/**
 * DAGGraph.ts
 * 
 * Core in-memory BlockDAG data structure.
 * Manages the entire DAG of blocks with multiple parent relationships.
 * 
 * Responsibilities:
 * - Store blocks in adjacency list structure
 * - Maintain parent-child relationships
 * - Track DAG tips (latest blocks with no children)
 * - Validate new blocks before adding
 * - Provide graph traversal methods
 * - Calculate DAG depth and metrics
 * 
 * This is the heart of the DagDev simulator.
 * 
 * @phase Phase 1 - Core DAG Implementation
 */

import { Block } from './Block';
import { BlueSetAlgorithm } from './BlueSetAlgorithm';

export class DAGGraph {
  private blocks: Map<string, Block>;           // hash -> Block
  private children: Map<string, Set<string>>;   // parent -> Set<child hashes>
  private tips: Set<string>;                    // Current DAG tips (no children)
  private genesisHash: string;
  private blueSetAlgorithm: BlueSetAlgorithm;

  constructor(k: number = 18) {
    this.blocks = new Map();
    this.children = new Map();
    this.tips = new Set();
    this.genesisHash = '';
    this.blueSetAlgorithm = new BlueSetAlgorithm(k);
    
    // Create genesis block
    this.initializeGenesis();
  }

  /**
   * Create and add the genesis block (no parents)
   * The genesis block is the foundation of the entire DAG
   */
  private initializeGenesis(): void {
    const genesisBlock = new Block([], [], '0xGenesisMiner');
    genesisBlock.setColor('blue');
    genesisBlock.setDepth(0);
    genesisBlock.setBlueScore(0);
    
    this.genesisHash = genesisBlock.header.hash;
    this.blocks.set(this.genesisHash, genesisBlock);
    this.children.set(this.genesisHash, new Set());
    this.tips.add(this.genesisHash);
  }

  /**
   * Add a new block to the DAG
   * Validates parents exist and updates graph structure
   * 
   * @param block - Block to add
   * @returns true if added successfully, false otherwise
   */
  addBlock(block: Block): boolean {
    const blockHash = block.header.hash;

    // Check if block already exists
    if (this.blocks.has(blockHash)) {
      return false;
    }

    // Validate all parent blocks exist
    for (const parentHash of block.header.parentHashes) {
      if (!this.blocks.has(parentHash)) {
        throw new Error(`Parent block ${parentHash} not found`);
      }
    }

    // Add block to graph
    this.blocks.set(blockHash, block);
    this.children.set(blockHash, new Set());

    // Update parent-child relationships
    for (const parentHash of block.header.parentHashes) {
      this.children.get(parentHash)?.add(blockHash);
      
      // Parent is no longer a tip
      this.tips.delete(parentHash);
    }

    // New block becomes a tip
    this.tips.add(blockHash);

    // Calculate DAG depth
    this.updateBlockDepth(block);

    // Run GHOSTDAG coloring
    this.recomputeBlueSet();

    return true;
  }

  /**
   * Update DAG depth for a block
   * Depth = max(parent depths) + 1
   */
  private updateBlockDepth(block: Block): void {
    let maxParentDepth = 0;
    
    for (const parentHash of block.header.parentHashes) {
      const parent = this.blocks.get(parentHash);
      if (parent && parent.dagDepth > maxParentDepth) {
        maxParentDepth = parent.dagDepth;
      }
    }
    
    block.setDepth(maxParentDepth + 1);
  }

  /**
   * Recompute blue set coloring using GHOSTDAG algorithm
   * This determines which blocks are "confirmed" (blue) vs "conflicting" (red)
   */
  private recomputeBlueSet(): void {
    const blueSet = this.blueSetAlgorithm.computeBlueSet(this);
    
    // Mark all blocks as red initially
    for (const block of this.blocks.values()) {
      block.setColor('red');
    }
    
    // Mark blue set blocks as blue
    for (const blockHash of blueSet) {
      const block = this.blocks.get(blockHash);
      if (block) {
        block.setColor('blue');
      }
    }
  }

  /**
   * Get a block by its hash
   */
  getBlock(hash: string): Block | undefined {
    return this.blocks.get(hash);
  }

  /**
   * Get all blocks in the DAG
   */
  getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }

  /**
   * Get children of a specific block
   */
  getChildren(blockHash: string): string[] {
    return Array.from(this.children.get(blockHash) || []);
  }

  /**
   * Get all ancestors (past cone) of a block
   * Ancestors = blocks that this block references directly or indirectly
   * 
   * @param blockHash - Hash of the block
   * @returns Set of ancestor block hashes
   */
  getAncestors(blockHash: string): Set<string> {
    const ancestors = new Set<string>();
    const queue = [blockHash];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const block = this.blocks.get(current);
      if (!block) continue;

      // Add all parents to ancestors
      for (const parentHash of block.header.parentHashes) {
        ancestors.add(parentHash);
        queue.push(parentHash);
      }
    }

    return ancestors;
  }

  /**
   * Get current DAG tips (blocks with no children)
   * These are the "latest" blocks in the DAG
   */
  getTips(): string[] {
    return Array.from(this.tips);
  }

  /**
   * Get genesis block hash
   */
  getGenesisHash(): string {
    return this.genesisHash;
  }

  /**
   * Get total number of blocks
   */
  getBlockCount(): number {
    return this.blocks.size;
  }

  /**
   * Get maximum DAG depth
   */
  getMaxDepth(): number {
    let maxDepth = 0;
    for (const block of this.blocks.values()) {
      if (block.dagDepth > maxDepth) {
        maxDepth = block.dagDepth;
      }
    }
    return maxDepth;
  }

  /**
   * Get blue blocks (confirmed)
   */
  getBlueBlocks(): Block[] {
    return Array.from(this.blocks.values()).filter(b => b.color === 'blue');
  }

  /**
   * Get red blocks (conflicting)
   */
  getRedBlocks(): Block[] {
    return Array.from(this.blocks.values()).filter(b => b.color === 'red');
  }

  /**
   * Check if a block is in the blue set
   */
  isBlue(blockHash: string): boolean {
    const block = this.blocks.get(blockHash);
    return block?.color === 'blue';
  }

  /**
   * Get DAG statistics
   */
  getStats() {
    return {
      totalBlocks: this.blocks.size,
      blueBlocks: this.getBlueBlocks().length,
      redBlocks: this.getRedBlocks().length,
      tips: this.tips.size,
      maxDepth: this.getMaxDepth(),
    };
  }

  /**
   * Get the anticone of a block
   * Anticone = set of blocks that are neither ancestors nor descendants
   * 
   * In BlockDAG, blocks can be mined in parallel. The anticone represents
   * blocks that were mined concurrently and have no ordering relationship.
   * 
   * @param blockHash - Hash of the block to find anticone for
   * @returns Set of block hashes in the anticone
   */
  getAnticone(blockHash: string): string[] {
    if (!this.blocks.has(blockHash)) {
      throw new Error(`Block not found: ${blockHash}`);
    }

    const ancestors = this.getAncestors(blockHash);
    const descendants = this.getDescendants(blockHash);
    const anticone: string[] = [];

    // All blocks that are NOT in past or future = anticone
    for (const hash of this.blocks.keys()) {
      if (hash !== blockHash && 
          !ancestors.has(hash) && 
          !descendants.has(hash)) {
        anticone.push(hash);
      }
    }

    return anticone;
  }

  /**
   * Get all descendants (future cone) of a block
   * Descendants = blocks that reference this block as an ancestor
   * 
   * @param blockHash - Hash of the block
   * @returns Set of descendant block hashes
   */
  getDescendants(blockHash: string): Set<string> {
    const descendants = new Set<string>();
    const queue = [blockHash];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Get all children of current block
      const children = this.children.get(current) || new Set();
      for (const child of children) {
        descendants.add(child);
        queue.push(child);
      }
    }

    return descendants;
  }

  /**
   * Get the anticone size for a block
   * Used by GHOSTDAG to determine blue/red coloring
   * 
   * @param blockHash - Hash of the block
   * @returns Size of the anticone
   */
  getAnticoneSize(blockHash: string): number {
    return this.getAnticone(blockHash).length;
  }
}
