/**
 * LocalNode.ts
 * 
 * Main local BlockDAG node implementation.
 * Orchestrates all components: DAG, Miner, Transaction Pool, RPC, WebSocket.
 * 
 * This is the "dagdev node" command backend.
 * 
 * Responsibilities:
 * - Initialize and manage DAG graph
 * - Control miner (start/stop/configure)
 * - Manage transaction pool
 * - Coordinate RPC server (future)
 * - Coordinate WebSocket server (future)
 * - Provide unified node API
 * 
 * @phase Phase 2 - Local Node & Mining Simulation
 */

import { DAGGraph } from '../dag/DAGGraph';
import { Miner, MinerConfig } from '../dag/Miner';
import { TransactionPool } from './TransactionPool';
import { Transaction } from '../dag/Block';
import { RPCServer } from './RPCServer';
import { WebSocketServer } from './WebSocketServer';
import EventEmitter from 'events';

export interface NodeConfig {
  port?: number;              // RPC server port (default: 8545)
  wsPort?: number;            // WebSocket port (default: 8546)
  miningConfig?: Partial<MinerConfig>;
  k?: number;                 // GHOSTDAG k parameter (default: 18)
  txPoolSize?: number;        // Transaction pool max size (default: 1000)
}

export class LocalNode extends EventEmitter {
  private dag: DAGGraph;
  private miner: Miner;
  private txPool: TransactionPool;
  private rpcServer: RPCServer;
  private wsServer: WebSocketServer;
  private config: Required<NodeConfig>;
  private isRunning: boolean;

  constructor(config: NodeConfig = {}) {
    super();
    
    this.config = {
      port: config.port ?? 8545,
      wsPort: config.wsPort ?? 8546,
      miningConfig: config.miningConfig ?? {},
      k: config.k ?? 18,
      txPoolSize: config.txPoolSize ?? 1000,
    };

    // Initialize DAG
    this.dag = new DAGGraph(this.config.k);
    console.log(`[LocalNode] DAG initialized with k=${this.config.k}`);

    // Initialize transaction pool
    this.txPool = new TransactionPool(this.config.txPoolSize);
    console.log(`[LocalNode] Transaction pool initialized (size=${this.config.txPoolSize})`);

    // Initialize miner
    this.miner = new Miner(this.dag, this.config.miningConfig);
    this.miner.setTransactionPool(this.txPool);
    console.log('[LocalNode] Miner initialized');

    // Connect miner events
    this.setupMinerEvents();

    // Initialize RPC Server
    this.rpcServer = new RPCServer(this, { port: this.config.port });
    console.log(`[LocalNode] RPC server initialized on port ${this.config.port}`);
    
    // Initialize WebSocket Server
    this.wsServer = new WebSocketServer(this, { port: this.config.wsPort });
    console.log(`[LocalNode] WebSocket server initialized on port ${this.config.wsPort}`);
    
    this.isRunning = false;
  }

  /**
   * Setup event listeners for miner
   */
  private setupMinerEvents(): void {
    this.miner.on('miningStarted', () => {
      console.log('[LocalNode] Mining started');
      this.emit('miningStarted');
    });

    this.miner.on('blockMined', (block) => {
      console.log(`[LocalNode] Block mined: ${block.header.hash.substring(0, 8)}...`);
      this.emit('blockMined', block);
      
      // Future: Broadcast to WebSocket clients
      // this.wsServer?.broadcast('blockMined', block);
    });

    this.miner.on('miningStopped', () => {
      console.log('[LocalNode] Mining stopped');
      this.emit('miningStopped');
    });
  }

  /**
   * Start the local node
   * Starts all services: RPC, WebSocket, Miner
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[LocalNode] Node is already running');
      return;
    }

    console.log('\n🚀 Starting DagDev Local Node...');
    console.log('='.repeat(50));
    
    // Start RPC server
    await this.rpcServer.start();
    
    // Start WebSocket server
    await this.wsServer.start();
    
    // Start miner
    this.miner.startMining();
    console.log(`⛏️  Miner: Started (${this.miner.getConfig().parallelism} blocks/${this.miner.getConfig().blockTime}ms)`);
    
    this.isRunning = true;
    console.log('='.repeat(50));
    console.log('✅ Node is running!\n');
    
    this.emit('started');
  }

  /**
   * Stop the local node
   * Stops all services gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('[LocalNode] Node is not running');
      return;
    }

    console.log('\n⏹️  Stopping DagDev Local Node...');
    
    // Stop miner
    this.miner.stopMining();
    console.log('⛏️  Miner stopped');
    
    // Stop RPC server
    await this.rpcServer.stop();
    
    // Stop WebSocket server
    await this.wsServer.stop();
    
    this.isRunning = false;
    console.log('✅ Node stopped\n');
    
    this.emit('stopped');
  }

  /**
   * Add a transaction to the pool
   * @returns true if added successfully
   */
  addTransaction(tx: Transaction): boolean {
    const added = this.txPool.addTransaction(tx);
    
    if (added) {
      console.log(`[LocalNode] Transaction added: ${tx.hash.substring(0, 8)}...`);
      this.emit('transactionAdded', tx);
      
      // Future: Broadcast to RPC/WebSocket
      // this.wsServer?.broadcast('transactionAdded', tx);
    }
    
    return added;
  }

  /**
   * Get DAG statistics
   */
  getStats() {
    const dagStats = this.dag.getStats();
    const poolStats = this.txPool.getStats();
    const minerConfig = this.miner.getConfig();

    return {
      dag: dagStats,
      txPool: poolStats,
      miner: {
        isRunning: this.miner.isMining(),
        blocksMined: this.miner.getBlocksMinedCount(),
        config: minerConfig,
      },
      node: {
        isRunning: this.isRunning,
        port: this.config.port,
        wsPort: this.config.wsPort,
      },
    };
  }

  /**
   * Get the DAG instance
   */
  getDAG(): DAGGraph {
    return this.dag;
  }

  /**
   * Get the miner instance
   */
  getMiner(): Miner {
    return this.miner;
  }

  /**
   * Get the transaction pool instance
   */
  getTransactionPool(): TransactionPool {
    return this.txPool;
  }

  /**
   * Check if node is running
   */
  isNodeRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update miner configuration
   * Note: Requires miner restart to take effect
   */
  updateMinerConfig(newConfig: Partial<MinerConfig>): void {
    this.miner.updateConfig(newConfig);
    console.log('[LocalNode] Miner configuration updated');
  }

  /**
   * Mine a specific number of blocks manually
   * Useful for testing and debugging
   */
  async mineBlocks(count: number): Promise<void> {
    console.log(`[LocalNode] Mining ${count} blocks manually...`);
    
    const wasRunning = this.miner.isMining();
    
    if (!wasRunning) {
      this.miner.startMining();
    }

    // Wait for blocks to be mined
    return new Promise((resolve) => {
      let minedCount = 0;
      const startCount = this.miner.getBlocksMinedCount();
      
      const listener = () => {
        minedCount = this.miner.getBlocksMinedCount() - startCount;
        
        if (minedCount >= count) {
          this.miner.off('blockMined', listener);
          
          if (!wasRunning) {
            this.miner.stopMining();
          }
          
          console.log(`[LocalNode] Mined ${count} blocks`);
          resolve();
        }
      };
      
      this.miner.on('blockMined', listener);
    });
  }

  /**
   * Clear the transaction pool
   */
  clearTransactionPool(): void {
    this.txPool.clear();
    console.log('[LocalNode] Transaction pool cleared');
  }

  /**
   * Get node configuration
   */
  getConfig(): Required<NodeConfig> {
    return { ...this.config };
  }

  /**
   * Get WebSocket server statistics
   */
  getWebSocketStats() {
    return this.wsServer.getStats();
  }
}

// ========================================
// Start node if this file is run directly
// ========================================
// Check if running directly (works with tsx/ts-node)
const isMainModule = process.argv[1]?.includes('LocalNode');

if (isMainModule) {
  const node = new LocalNode({
    port: 8545,
    wsPort: 8546,
    k: 18,
    miningConfig: {
      blockTime: 2000,      // Mine every 2 seconds
      parallelism: 2,       // 2 parallel blocks per round
    }
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down...');
    await node.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the node
  node.start().catch((error) => {
    console.error('❌ Failed to start node:', error);
    process.exit(1);
  });
}
