/**
 * TransactionPool.ts
 * 
 * Transaction mempool (memory pool) for pending transactions.
 * Stores transactions waiting to be included in blocks.
 * 
 * Features:
 * - Add transactions
 * - Remove transactions (when included in block)
 * - Get transactions sorted by gas price
 * - Validate transactions
 * - Track transaction status
 * 
 * @phase Phase 2 - Local Node & Mining Simulation
 */

import { Transaction } from '../dag/Block';

export interface PendingTransaction {
  tx: Transaction;
  addedAt: number;           // Timestamp when added
  attempts: number;          // Number of mining attempts
}

export class TransactionPool {
  private pool: Map<string, PendingTransaction>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.pool = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Add transaction to pool
   */
  addTransaction(tx: Transaction): boolean {
    // Check pool size limit
    if (this.pool.size >= this.maxSize) {
      // Remove lowest gas price transaction
      this.evictLowestGasPriceTx();
    }

    // Check if transaction already exists
    if (this.pool.has(tx.hash)) {
      return false;
    }

    // TODO: Validate transaction
    // - Check signature
    // - Check nonce
    // - Check balance

    this.pool.set(tx.hash, {
      tx,
      addedAt: Date.now(),
      attempts: 0,
    });

    return true;
  }

  /**
   * Remove transaction from pool
   */
  removeTransaction(txHash: string): boolean {
    return this.pool.delete(txHash);
  }

  /**
   * Get transaction by hash
   */
  getTransaction(txHash: string): Transaction | undefined {
    return this.pool.get(txHash)?.tx;
  }

  /**
   * Get all pending transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(this.pool.values()).map(pt => pt.tx);
  }

  /**
   * Get transactions sorted by gas price (highest first)
   * Used by miner to select transactions for block
   */
  getTransactionsByGasPrice(limit?: number): Transaction[] {
    const txs = Array.from(this.pool.values())
      .sort((a, b) => {
        // Sort by gas price descending
        return Number(b.tx.gasPrice - a.tx.gasPrice);
      })
      .map(pt => pt.tx);

    return limit ? txs.slice(0, limit) : txs;
  }

  /**
   * Alias for getTransactionsByGasPrice (used by Miner)
   * Get pending transactions for mining
   */
  getPending(limit?: number): Transaction[] {
    return this.getTransactionsByGasPrice(limit);
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.pool.size;
  }

  /**
   * Clear entire pool
   */
  clear(): void {
    this.pool.clear();
  }

  /**
   * Evict transaction with lowest gas price
   */
  private evictLowestGasPriceTx(): void {
    let lowestGasPrice = BigInt(Number.MAX_SAFE_INTEGER);
    let lowestTxHash = '';

    for (const [hash, pt] of this.pool.entries()) {
      if (pt.tx.gasPrice < lowestGasPrice) {
        lowestGasPrice = pt.tx.gasPrice;
        lowestTxHash = hash;
      }
    }

    if (lowestTxHash) {
      this.pool.delete(lowestTxHash);
    }
  }

  /**
   * Increment attempt counter for transaction
   */
  incrementAttempt(txHash: string): void {
    const pending = this.pool.get(txHash);
    if (pending) {
      pending.attempts++;
    }
  }

  /**
   * Get transactions for specific sender
   */
  getTransactionsBySender(sender: string): Transaction[] {
    return Array.from(this.pool.values())
      .filter(pt => pt.tx.from === sender)
      .map(pt => pt.tx);
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalTransactions: this.pool.size,
      maxSize: this.maxSize,
      utilization: (this.pool.size / this.maxSize * 100).toFixed(2) + '%',
    };
  }
}
