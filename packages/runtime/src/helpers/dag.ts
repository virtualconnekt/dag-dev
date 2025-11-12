/**
 * dag.ts
 * 
 * Helper functions for DAG operations.
 * Convenience wrappers for common DAG tasks.
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

import { DAGGraph, Block } from '@dagdev/core';

/**
 * DAG Helper Class
 * Provides convenient methods for DAG inspection
 */
export class DAGHelpers {
  constructor(private getDAG: () => DAGGraph) {}

  /**
   * Get current DAG depth (maximum distance from genesis)
   */
  async getDepth(): Promise<number> {
    const dag = this.getDAG();
    return dag.getMaxDepth();
  }

  /**
   * Get the genesis block
   */
  getGenesis(): Block {
    const dag = this.getDAG();
    const genesisHash = dag.getGenesisHash();
    return dag.getBlock(genesisHash)!;
  }

  /**
   * Get a block by its hash
   */
  async getBlock(hash: string): Promise<Block | undefined> {
    const dag = this.getDAG();
    return dag.getBlock(hash);
  }

  /**
   * Get all current tips (blocks with no children)
   */
  async getTips(): Promise<string[]> {
    const dag = this.getDAG();
    return dag.getTips();
  }

  /**
   * Get the blue set (confirmed blocks in the main chain)
   */
  async getBlueSet(): Promise<string[]> {
    const dag = this.getDAG();
    const allBlocks = dag.getAllBlocks();
    return allBlocks
      .filter(b => b.color === 'blue')
      .map(b => b.header.hash);
  }

  /**
   * Check if a block is in the blue set
   */
  async isBlue(blockHash: string): Promise<boolean> {
    const block = await this.getBlock(blockHash);
    return block?.color === 'blue';
  }

  /**
   * Check if a block is in the red set
   */
  async isRed(blockHash: string): Promise<boolean> {
    const block = await this.getBlock(blockHash);
    return block?.color === 'red';
  }

  /**
   * Get the anticone of a block
   * (blocks that are not ancestors or descendants)
   */
  async getAnticone(blockHash: string): Promise<string[]> {
    const dag = this.getDAG();
    const block = dag.getBlock(blockHash);
    if (!block) return [];
    
    return dag.getAnticone(blockHash);
  }

  /**
   * Get all parent hashes of a block
   */
  async getParents(blockHash: string): Promise<string[]> {
    const block = await this.getBlock(blockHash);
    return block?.header.parentHashes || [];
  }

  /**
   * Get all children of a block
   */
  async getChildren(blockHash: string): Promise<string[]> {
    const dag = this.getDAG();
    const allBlocks = dag.getAllBlocks();
    
    return allBlocks
      .filter(b => b.header.parentHashes.includes(blockHash))
      .map(b => b.header.hash);
  }

  /**
   * Get the blue score of a block
   */
  async getBlueScore(blockHash: string): Promise<number> {
    const block = await this.getBlock(blockHash);
    return block?.blueScore || 0;
  }

  /**
   * Get the DAG depth of a specific block
   */
  async getBlockDepth(blockHash: string): Promise<number> {
    const block = await this.getBlock(blockHash);
    return block?.dagDepth || 0;
  }

  /**
   * Get all blocks in the DAG
   */
  async getAllBlocks(): Promise<Block[]> {
    const dag = this.getDAG();
    return dag.getAllBlocks();
  }

  /**
   * Get total number of blocks
   */
  async getBlockCount(): Promise<number> {
    const dag = this.getDAG();
    return dag.getAllBlocks().length;
  }

  /**
   * Get blocks at a specific depth
   */
  async getBlocksAtDepth(depth: number): Promise<Block[]> {
    const dag = this.getDAG();
    return dag.getAllBlocks().filter(b => b.dagDepth === depth);
  }

  /**
   * Find the lowest common ancestor of two blocks
   */
  async findLCA(hash1: string, hash2: string): Promise<string | null> {
    // Simple implementation: find common ancestors
    const ancestors1 = await this.getAncestors(hash1);
    const ancestors2 = await this.getAncestors(hash2);
    
    // Find the deepest common ancestor
    const common = ancestors1.filter(h => ancestors2.includes(h));
    if (common.length === 0) return null;
    
    // Get depths and find maximum
    const depths = await Promise.all(
      common.map(async h => ({ hash: h, depth: await this.getBlockDepth(h) }))
    );
    
    depths.sort((a, b) => b.depth - a.depth);
    return depths[0]?.hash || null;
  }

  /**
   * Get all ancestors of a block
   */
  async getAncestors(blockHash: string): Promise<string[]> {
    const ancestors = new Set<string>();
    const queue = [blockHash];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = await this.getParents(current);
      
      for (const parent of parents) {
        if (!ancestors.has(parent) && parent !== blockHash) {
          ancestors.add(parent);
          queue.push(parent);
        }
      }
    }
    
    return Array.from(ancestors);
  }

  /**
   * Check if block1 is an ancestor of block2
   */
  async isAncestor(ancestorHash: string, descendantHash: string): Promise<boolean> {
    const ancestors = await this.getAncestors(descendantHash);
    return ancestors.includes(ancestorHash);
  }

  /**
   * Get DAG statistics
   */
  async getStats(): Promise<{
    totalBlocks: number;
    blueBlocks: number;
    redBlocks: number;
    tipCount: number;
    maxDepth: number;
    blueRatio: number;
  }> {
    const dag = this.getDAG();
    const allBlocks = dag.getAllBlocks();
    const blueBlocks = allBlocks.filter(b => b.color === 'blue').length;
    const redBlocks = allBlocks.filter(b => b.color === 'red').length;
    const tips = dag.getTips();
    const maxDepth = dag.getMaxDepth();
    
    return {
      totalBlocks: allBlocks.length,
      blueBlocks,
      redBlocks,
      tipCount: tips.length,
      maxDepth,
      blueRatio: allBlocks.length > 0 ? Math.round((blueBlocks / allBlocks.length) * 100) : 0
    };
  }

  /**
   * Pretty print DAG structure (for debugging)
   */
  async printDAG(maxBlocks: number = 20): Promise<void> {
    const blocks = await this.getAllBlocks();
    const tips = await this.getTips();
    
    console.log('\n📊 DAG Structure:');
    console.log('═══════════════════════════════════════');
    
    const toShow = blocks.slice(-maxBlocks);
    for (const block of toShow) {
      const isTip = tips.includes(block.header.hash);
      const color = block.color === 'blue' ? '💙' : '❤️';
      const tipMarker = isTip ? '🔝' : '  ';
      
      console.log(
        `${tipMarker} ${color} ${block.header.hash.substring(0, 8)}... ` +
        `depth=${block.dagDepth} score=${block.blueScore} ` +
        `parents=${block.header.parentHashes.length}`
      );
    }
    
    if (blocks.length > maxBlocks) {
      console.log(`... (${blocks.length - maxBlocks} more blocks)`);
    }
    
    console.log('═══════════════════════════════════════\n');
  }
}
