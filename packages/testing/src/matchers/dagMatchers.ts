/**
 * dagMatchers.ts
 * 
 * Custom Chai matchers for DAG-aware assertions.
 * Extends Chai with DAG-specific expectations.
 * 
 * Custom Matchers:
 * - toBeInBlueSet() - Assert transaction/block is in blue set
 * - toHaveParents(count) - Assert block has N parents
 * - toBeConfirmed(options) - Assert transaction is confirmed
 * - toHaveDepth(depth) - Assert block has specific DAG depth
 * - toBeColoredBlue() - Assert block is colored blue
 * - toBeColoredRed() - Assert block is colored red
 * - toHaveAnticone(count) - Assert block has N blocks in anticone
 * 
 * Usage:
 * ```typescript
 * expect(tx).toBeInBlueSet();
 * expect(blockHash).toHaveParents(2);
 * expect(blockHash).toBeConfirmed();
 * expect(blockHash).toHaveDepth(5);
 * expect(blockHash).toBeColoredBlue();
 * ```
 * 
 * @phase Phase 5 - Testing Framework
 */

import type { LocalNode } from '@dagdev/core';

// Global reference to node instance (set by test runner)
let globalNode: LocalNode | null = null;

export function setGlobalNode(node: LocalNode): void {
  globalNode = node;
}

export function dagMatchers(chai: any, utils: any): void {
  const Assertion = chai.Assertion;

  /**
   * Assert that transaction/block hash is in blue set
   * 
   * Usage: expect(blockHash).toBeInBlueSet()
   */
  Assertion.addMethod('toBeInBlueSet', function () {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized. Make sure to use DagTestRunner.');
    }

    const dag = globalNode.getDAG();
    const blueSet = dag.getBlueSet();
    const isBlue = blueSet.some((blockHash: string) => blockHash === hash);
    
    this.assert(
      isBlue,
      `expected block ${hash.substring(0, 8)}... to be in blue set`,
      `expected block ${hash.substring(0, 8)}... not to be in blue set`,
      true,
      isBlue
    );
  });

  /**
   * Assert that block has specific number of parents
   * 
   * Usage: expect(blockHash).toHaveParents(2)
   */
  Assertion.addMethod('toHaveParents', function (expectedCount: number) {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const block = dag.getBlock(hash);
    
    if (!block) {
      throw new Error(`Block ${hash} not found in DAG`);
    }

    const actualCount = block.header.parentHashes.length;
    
    this.assert(
      actualCount === expectedCount,
      `expected block to have ${expectedCount} parents but got ${actualCount}`,
      `expected block not to have ${expectedCount} parents`,
      expectedCount,
      actualCount
    );
  });

  /**
   * Assert that transaction is confirmed (in a blue block)
   * 
   * Usage: expect(txHash).toBeConfirmed()
   */
  Assertion.addMethod('toBeConfirmed', function () {
    const txHash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const blueSet = dag.getBlueSet();
    
    // Find the block containing this transaction
    let containingBlock: any = null;
    for (const blockHash of blueSet) {
      const block = dag.getBlock(blockHash);
      if (block && block.transactions) {
        const found = block.transactions.some((tx: any) => {
          const hash = typeof tx === 'string' ? tx : tx.hash;
          return hash === txHash;
        });
        if (found) {
          containingBlock = block;
          break;
        }
      }
    }
    
    const isConfirmed = containingBlock !== null;
    
    this.assert(
      isConfirmed,
      `expected transaction ${txHash.substring(0, 8)}... to be confirmed in a blue block`,
      `expected transaction ${txHash.substring(0, 8)}... not to be confirmed`,
      true,
      isConfirmed
    );
  });

  /**
   * Assert that block has specific DAG depth
   * 
   * Usage: expect(blockHash).toHaveDepth(3)
   */
  Assertion.addMethod('toHaveDepth', function (expectedDepth: number) {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const block = dag.getBlock(hash);
    
    if (!block) {
      throw new Error(`Block ${hash} not found in DAG`);
    }

    const actualDepth = block.depth;
    
    this.assert(
      actualDepth === expectedDepth,
      `expected block to have depth ${expectedDepth} but got ${actualDepth}`,
      `expected block not to have depth ${expectedDepth}`,
      expectedDepth,
      actualDepth
    );
  });

  /**
   * Assert that block is colored blue
   * 
   * Usage: expect(blockHash).toBeColoredBlue()
   */
  Assertion.addMethod('toBeColoredBlue', function () {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const block = dag.getBlock(hash);
    
    if (!block) {
      throw new Error(`Block ${hash} not found in DAG`);
    }

    const isBlue = block.color === 'blue';
    
    this.assert(
      isBlue,
      `expected block ${hash.substring(0, 8)}... to be colored blue but was ${block.color}`,
      `expected block ${hash.substring(0, 8)}... not to be colored blue`,
      'blue',
      block.color
    );
  });

  /**
   * Assert that block is colored red
   * 
   * Usage: expect(blockHash).toBeColoredRed()
   */
  Assertion.addMethod('toBeColoredRed', function () {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const block = dag.getBlock(hash);
    
    if (!block) {
      throw new Error(`Block ${hash} not found in DAG`);
    }

    const isRed = block.color === 'red';
    
    this.assert(
      isRed,
      `expected block ${hash.substring(0, 8)}... to be colored red but was ${block.color}`,
      `expected block ${hash.substring(0, 8)}... not to be colored red`,
      'red',
      block.color
    );
  });

  /**
   * Assert that block has specific number of blocks in anticone
   * 
   * Usage: expect(blockHash).toHaveAnticone(5)
   */
  Assertion.addMethod('toHaveAnticone', function (expectedCount: number) {
    const hash = this._obj;
    
    if (!globalNode) {
      throw new Error('DagDev test context not initialized');
    }

    const dag = globalNode.getDAG();
    const block = dag.getBlock(hash);
    
    if (!block) {
      throw new Error(`Block ${hash} not found in DAG`);
    }

    const anticone = dag.getAnticone(hash);
    const actualCount = anticone.length;
    
    this.assert(
      actualCount === expectedCount,
      `expected block to have anticone size ${expectedCount} but got ${actualCount}`,
      `expected block not to have anticone size ${expectedCount}`,
      expectedCount,
      actualCount
    );
  });

  /**
   * Assert that a value is approximately equal (for gas estimates, balances)
   * 
   * Usage: expect(actualGas).toBeApproximately(expectedGas, 0.1)
   */
  Assertion.addMethod('toBeApproximately', function (expected: number, tolerancePercent: number = 0.05) {
    const actual = Number(this._obj);
    const tolerance = expected * tolerancePercent;
    const isWithinTolerance = Math.abs(actual - expected) <= tolerance;
    
    this.assert(
      isWithinTolerance,
      `expected ${actual} to be approximately ${expected} (±${tolerancePercent * 100}%)`,
      `expected ${actual} not to be approximately ${expected}`,
      expected,
      actual
    );
  });
}

// Type declarations for TypeScript
declare global {
  namespace Chai {
    interface Assertion {
      toBeInBlueSet(): Assertion;
      toHaveParents(count: number): Assertion;
      toBeConfirmed(): Assertion;
      toHaveDepth(depth: number): Assertion;
      toBeColoredBlue(): Assertion;
      toBeColoredRed(): Assertion;
      toHaveAnticone(count: number): Assertion;
      toBeApproximately(expected: number, tolerancePercent?: number): Assertion;
    }
  }
}
