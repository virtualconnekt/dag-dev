/**
 * node.ts
 * 
 * Implementation of `dagdev node` command.
 * Starts the local DAG node for development.
 * 
 * @phase Phase 7 - CLI Tool
 */

import { LocalNode } from '@dagdev/core';
import { ConfigLoader } from '@dagdev/config';
import * as path from 'path';

interface NodeOptions {
  port?: number;
  wsPort?: number;
  network?: string;
  mining?: boolean;
  verbose?: boolean;
}

export async function nodeCommand(options: NodeOptions = {}): Promise<void> {
  console.log('🚀 Starting DagDev node...\n');

  try {
    // Load config
    const projectPath = process.cwd();
    let config;
    try {
      config = await ConfigLoader.load(projectPath);
    } catch (error) {
      console.log('⚠️  Using default configuration\n');
      config = {
        defaultNetwork: 'local',
        networks: {
          local: {
            rpcUrl: 'http://localhost:8545',
            chainId: 1337,
          }
        },
        dag: {
          k: 10,
          parallelism: 3,
          miningInterval: 2000
        }
      };
    }
    
    // Get network config
    const networkName = options.network || config.defaultNetwork || 'local';
    const networkConfig = config.networks?.[networkName];
    
    // Check if this is a remote network (not local)
    if (networkName !== 'local') {
      console.log(`📡 Network: ${networkName}`);
      console.log(`⚠️  This is a remote network - no local node will be started.\n`);
      
      if (networkConfig) {
        const rpcUrl = networkConfig.rpcUrl || networkConfig.url;
        console.log(`RPC Endpoint: ${rpcUrl}`);
        console.log(`Chain ID: ${networkConfig.chainId}`);
        if (networkConfig.explorer) {
          console.log(`Explorer: ${networkConfig.explorer}`);
        }
      }
      
      console.log('\n💡 To deploy to this network, use:');
      console.log(`   dagdev run scripts/deploy.js --network ${networkName}\n`);
      console.log('⚠️  Make sure to configure your private key:');
      console.log(`   1. Create .env file from .env.example`);
      console.log(`   2. Set ${networkName.toUpperCase()}_PRIVATE_KEY=your_private_key`);
      console.log(`   3. Or configure accounts in dagdev.config.ts\n`);
      return;
    }
    
    // Start local node
    console.log('🏠 Starting local blockchain node...\n');
    
    // Override with CLI options
    const port = options.port || 8545;
    const wsPort = options.wsPort || 8546;
    
    console.log(`📋 Configuration:`);
    console.log(`   Network: ${networkName}`);
    console.log(`   RPC Port: ${port}`);
    console.log(`   WebSocket Port: ${wsPort}`);
    console.log(`   DAG k parameter: ${config.dag?.k || 10}`);
    console.log(`   Parallelism: ${config.dag?.parallelism || 3}`);
    console.log(`   Mining interval: ${config.dag?.miningInterval || 2000}ms\n`);

    // Create and start node
    const node = new LocalNode({
      port,
      wsPort,
      k: config.dag?.k || 10,
      miningConfig: {
        blockTime: config.dag?.miningInterval || 2000,
        parallelism: config.dag?.parallelism || 3,
      },
    });

    await node.start();
    
    // Optionally stop auto-mining
    if (options.mining === false) {
      node.getMiner().stopMining();
      console.log('⚠️  Auto-mining disabled (use --mining to enable)\n');
    }

    console.log('📊 Node Statistics:');
    console.log(`   RPC Endpoint: http://localhost:${port}`);
    console.log(`   WebSocket: ws://localhost:${wsPort}/ws`);
    console.log(`   Chain ID: 1337\n`);

    if (options.verbose) {
      // Show detailed stats periodically
      setInterval(() => {
        const stats = node.getStats();
        console.log(`\n📈 Stats Update:`);
        console.log(`   Blocks: ${stats.dag.totalBlocks}`);
        console.log(`   Blue: ${stats.dag.blueBlocks}, Red: ${stats.dag.redBlocks}`);
        console.log(`   Tips: ${stats.dag.tips}`);
        console.log(`   Depth: ${stats.dag.maxDepth}`);
        console.log(`   Transactions: ${stats.txPool.totalTransactions}`);
      }, 10000); // Every 10 seconds
    }

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\n\n⏹️  Shutting down node...');
      await node.stop();
      console.log('✅ Node stopped gracefully\n');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('✅ Node is running. Press Ctrl+C to stop.\n');
    
  } catch (error: any) {
    console.error(`\n❌ Failed to start node: ${error.message}\n`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
