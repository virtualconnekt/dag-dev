/**
 * BlueSetAlgorithm.ts
 * 
 * Implementation of the GHOSTDAG (Greedy Heaviest Observed SubTree DAG) algorithm.
 * This algorithm determines which blocks are "confirmed" (blue) vs "conflicting" (red).
 * 
 * GHOSTDAG is the consensus mechanism used by BlockDAG networks like Kaspa.
 * 
 * Key Concepts:
 * - Blue blocks = confirmed, part of the main DAG chain
 * - Red blocks = conflicting, potentially orphaned
 * - k parameter = maximum allowed anticone size
 * - Anticone = blocks that don't reference each other
 * 
 * Algorithm Steps:
 * 1. Start from genesis (always blue)
 * 2. For each block, compute its anticone with existing blue set
 * 3. If anticone size ≤ k, mark block as blue
 * 4. Order blocks by blue score (number of blue blocks in past)
 * 
 * @phase Phase 1 - Core DAG Implementation
 */

import { DAGGraph } from './DAGGraph';
import { Block } from './Block';

export class BlueSetAlgorithm {
  private k: number;  // Maximum anticone size parameter

  /**
   * @param k - GHOSTDAG k parameter (typically 18 for Kaspa)
   */
  constructor(k: number = 18) {
    this.k = k;
  }

  /**
   * Compute the blue set for the entire DAG
   * Returns a set of block hashes that are in the blue set
   * 
   * This is a simplified version of GHOSTDAG for the MVP.
   * Full implementation would include:
   * - Proper anticone calculation
   * - Blue score computation
   * - Topological ordering
   */
  computeBlueSet(dag: DAGGraph): Set<string> {
    const blueSet = new Set<string>();
    const blocks = dag.getAllBlocks();

    // Genesis is always blue
    const genesis = dag.getGenesisHash();
    blueSet.add(genesis);

    // Sort blocks by depth (topological order approximation)
    const sortedBlocks = blocks
      .filter(b => !b.isGenesis())
      .sort((a, b) => a.dagDepth - b.dagDepth);

    // Process blocks in order
    for (const block of sortedBlocks) {
      const blockHash = block.header.hash;
      
      // Calculate anticone size with current blue set
      const anticoneSize = this.calculateAnticoneSize(
        block,
        blueSet,
        dag
      );

      // If anticone is small enough, add to blue set
      if (anticoneSize <= this.k) {
        blueSet.add(blockHash);
      }
    }

    return blueSet;
  }

  /**
   * Calculate anticone size for a block with respect to blue set
   * 
   * Anticone = blue blocks that are not in the past or future of this block
   * 
   * Simplified calculation for MVP:
   * - Count blue blocks that don't reference this block
   * - And this block doesn't reference them
   */
  private calculateAnticoneSize(
    block: Block,
    blueSet: Set<string>,
    dag: DAGGraph
  ): number {
    const blockPast = this.getPast(block, dag);
    const blockFuture = this.getFuture(block, dag);
    
    let anticoneSize = 0;

    for (const blueHash of blueSet) {
      // Skip if in past or future
      if (blockPast.has(blueHash) || blockFuture.has(blueHash)) {
        continue;
      }
      
      // This block is in anticone
      anticoneSize++;
    }

    return anticoneSize;
  }

  /**
   * Get all blocks in the past (ancestors) of a block
   * Uses DFS traversal through parent links
   */
  private getPast(block: Block, dag: DAGGraph): Set<string> {
    const past = new Set<string>();
    const queue = [...block.header.parentHashes];

    while (queue.length > 0) {
      const hash = queue.shift()!;
      
      if (past.has(hash)) {
        continue;
      }
      
      past.add(hash);
      
      const parentBlock = dag.getBlock(hash);
      if (parentBlock) {
        queue.push(...parentBlock.header.parentHashes);
      }
    }

    return past;
  }

  /**
   * Get all blocks in the future (descendants) of a block
   * Uses BFS traversal through child links
   */
  private getFuture(block: Block, dag: DAGGraph): Set<string> {
    const future = new Set<string>();
    const queue = [block.header.hash];

    while (queue.length > 0) {
      const hash = queue.shift()!;
      
      const children = dag.getChildren(hash);
      for (const childHash of children) {
        if (!future.has(childHash)) {
          future.add(childHash);
          queue.push(childHash);
        }
      }
    }

    return future;
  }

  /**
   * Calculate blue score for a block
   * Blue score = number of blue blocks in the past
   * Used for ordering blocks
   */
  calculateBlueScore(
    block: Block,
    blueSet: Set<string>,
    dag: DAGGraph
  ): number {
    const past = this.getPast(block, dag);
    
    let score = 0;
    for (const pastHash of past) {
      if (blueSet.has(pastHash)) {
        score++;
      }
    }
    
    return score;
  }

  /**
   * Set k parameter
   */
  setK(k: number): void {
    this.k = k;
  }

  /**
   * Get k parameter
   */
  getK(): number {
    return this.k;
  }
}
