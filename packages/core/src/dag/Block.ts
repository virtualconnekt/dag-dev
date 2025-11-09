/**
 * Block.ts
 * 
 * Represents a single block in the BlockDAG structure.
 * Unlike traditional blockchain blocks that have one parent,
 * DAG blocks can reference multiple parent blocks, enabling parallel mining.
 * 
 * Features:
 * - Multiple parent references (DAG structure)
 * - Blue/Red coloring for GHOSTDAG consensus
 * - Timestamp and nonce for mining
 * - Transaction storage
 * - EVM state root reference
 * 
 * @phase Phase 1 - Core DAG Implementation
 */

import crypto from 'crypto';

export interface BlockHeader {
  hash: string;              // Unique block identifier
  parentHashes: string[];    // References to parent blocks (multiple!)
  timestamp: number;         // Block creation time
  nonce: number;             // Mining proof-of-work
  stateRoot: string;         // EVM world state root
  transactionsRoot: string;  // Merkle root of transactions
  miner: string;             // Address of block creator
  difficulty: number;        // Mining difficulty
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  data: string;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
}

export class Block {
  public header: BlockHeader;
  public transactions: Transaction[];
  public color: 'blue' | 'red' | 'pending'; // GHOSTDAG coloring
  public dagDepth: number;                   // Distance from genesis
  public blueScore: number;                  // GHOSTDAG blue score

  constructor(
    parentHashes: string[],
    transactions: Transaction[] = [],
    miner: string = '0x0000000000000000000000000000000000000000'
  ) {
    this.header = {
      hash: '',  // Will be computed after creation
      parentHashes,
      timestamp: Date.now(),
      nonce: 0,
      stateRoot: '0x0',
      transactionsRoot: '0x0',
      miner,
      difficulty: 1
    };
    this.transactions = transactions;
    this.color = 'pending';
    this.dagDepth = 0;
    this.blueScore = 0;

    // Compute hash after initialization
    this.header.hash = this.computeHash();
  }

  /**
   * Compute block hash based on header contents
   * Uses SHA-256 of serialized header
   * 
   * Hash includes: parentHashes, timestamp, nonce, transactions, miner
   * This ensures block integrity and uniqueness
   */
  computeHash(): string {
    const data = JSON.stringify({
      parentHashes: this.header.parentHashes,
      timestamp: this.header.timestamp,
      nonce: this.header.nonce,
      transactionsRoot: this.header.transactionsRoot,
      miner: this.header.miner,
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if this block has a specific parent
   * Used for graph traversal and validation
   */
  hasParent(parentHash: string): boolean {
    return this.header.parentHashes.includes(parentHash);
  }

  /**
   * Get number of parent blocks
   * DAG blocks can have 1-N parents
   */
  getParentCount(): number {
    return this.header.parentHashes.length;
  }

  /**
   * Mark block as blue (confirmed) or red (conflicting)
   * This is set by the GHOSTDAG blue-set algorithm
   */
  setColor(color: 'blue' | 'red'): void {
    this.color = color;
  }

  /**
   * Set the DAG depth (topological distance from genesis)
   */
  setDepth(depth: number): void {
    this.dagDepth = depth;
  }

  /**
   * Set the blue score for GHOSTDAG ordering
   */
  setBlueScore(score: number): void {
    this.blueScore = score;
  }

  /**
   * Check if block is genesis (no parents)
   */
  isGenesis(): boolean {
    return this.header.parentHashes.length === 0;
  }

  /**
   * Serialize block to JSON for storage/transmission
   */
  toJSON() {
    return {
      header: this.header,
      transactions: this.transactions.map(tx => ({
        ...tx,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
      })),
      color: this.color,
      dagDepth: this.dagDepth,
      blueScore: this.blueScore,
    };
  }
}
