/**
 * DagTestRunner.ts
 * 
 * Mocha wrapper with DAG-aware test context.
 * Extends Mocha to provide DAG-specific testing capabilities.
 * 
 * Features:
 * - DAG test context (access to node, miner, etc.)
 * - Custom test hooks (beforeDAG, afterDAG)
 * - Automatic node setup/teardown
 * - Snapshot/restore for test isolation
 * 
 * Usage:
 * ```typescript
 * describe('MyContract', function() {
 *   it('should deploy on DAG', async function() {
 *     await this.dagdev.mineParallel(3);
 *     // ... test code
 *   });
 * });
 * ```
 * 
 * @phase Phase 5 - Testing Framework
 */

import Mocha from 'mocha';
import { LocalNode } from '@dagdev/core';
import { DagRuntime } from '@dagdev/runtime';

export interface TestRunnerConfig {
  port?: number;
  wsPort?: number;
  k?: number;
  miningConfig?: {
    blockTime?: number;
    parallelism?: number;
  };
  timeout?: number;
  useExistingNode?: boolean;  // New: Use existing node instead of starting one
}

export class DagTestRunner {
  private mocha: Mocha;
  private node: LocalNode | null = null;
  private runtime: DagRuntime | null = null;
  private config: TestRunnerConfig;
  private snapshots: Map<string, any> = new Map();

  constructor(config: TestRunnerConfig = {}) {
    this.config = {
      port: config.port ?? 18545,  // Changed: Use different port for tests (18545)
      wsPort: config.wsPort ?? 18546,  // Changed: Use different port for tests (18546)
      k: config.k ?? 18,
      miningConfig: config.miningConfig ?? {
        blockTime: 1000,
        parallelism: 2,
      },
      timeout: config.timeout ?? 10000,
      useExistingNode: config.useExistingNode ?? false,
    };

    this.mocha = new Mocha({
      timeout: this.config.timeout,
      color: true,
      ui: 'bdd',
    });
  }

  /**
   * Add test file
   */
  addFile(file: string): void {
    this.mocha.addFile(file);
  }

  /**
   * Run tests
   */
  async run(): Promise<number> {
    // Setup node before tests
    await this.setupNode();
    
    // Run Mocha tests
    return new Promise((resolve) => {
      this.mocha.run((failures) => {
        this.teardownNode().then(() => {
          resolve(failures);
        });
      });
    });
  }

  /**
   * Setup test environment
   */
  private async setupNode(): Promise<void> {
    console.log('\n🧪 Setting up DagDev test environment...\n');
    
    // Create local node
    this.node = new LocalNode({
      port: this.config.port,
      wsPort: this.config.wsPort,
      k: this.config.k,
      miningConfig: this.config.miningConfig,
    });

    // Create runtime
    this.runtime = new DagRuntime(this.node);

    // Start node (without auto-mining for tests)
    await this.node.start();
    
    // Stop auto-mining for manual control in tests
    this.node.getMiner().stopMining();
    
    console.log('✅ Test environment ready\n');
    
    // Inject dagdev context into tests
    this.injectContext();
  }

  /**
   * Teardown test environment
   */
  private async teardownNode(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...\n');
    
    if (this.node) {
      await this.node.stop();
      this.node = null;
    }
    
    this.runtime = null;
    this.snapshots.clear();
  }

  /**
   * Inject dagdev context into Mocha tests
   */
  private injectContext(): void {
    if (!this.runtime || !this.node) {
      throw new Error('Cannot inject context: runtime or node not initialized');
    }

    const runtime = this.runtime;
    const node = this.node;
    const runner = this;

    // Extend Mocha's test context
    // Add dagdev to global context
    (global as any).dagdev = runtime;
    (global as any).dagNode = node;

    // Helper to create snapshot
    (global as any).snapshot = async function(name: string = 'default') {
      const evm = node.getMiner().getEVMExecutor();
      await evm.checkpoint();
      runner.snapshots.set(name, true);
      console.log(`📸 Snapshot "${name}" created`);
    };

    // Helper to restore snapshot
    (global as any).revert = async function(name: string = 'default') {
      const evm = node.getMiner().getEVMExecutor();
      await evm.revert();
      runner.snapshots.delete(name);
      console.log(`⏮️  Reverted to snapshot "${name}"`);
    };
  }

  /**
   * Get the runtime instance
   */
  getRuntime(): DagRuntime | null {
    return this.runtime;
  }

  /**
   * Get the node instance
   */
  getNode(): LocalNode | null {
    return this.node;
  }
}

/**
 * Extend Mocha Context with DAG helpers
 */
declare module 'mocha' {
  export interface Context {
    dagdev: any;  // DagRuntime instance
  }
}
