/**
 * run.ts
 * 
 * Implementation of `dagdev run` command.
 * Executes deployment and utility scripts with DagRuntime context.
 * 
 * @phase Phase 7 - CLI Tool
 */

import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { ConfigLoader } from '@dagdev/config';
import { logger } from '../utils/logger';
import { createSpinner } from '../utils/spinner';

// Load environment variables from .env file
loadEnv();

// Dynamic import for DagRuntime to avoid bundling issues
const loadDagRuntime = async () => {
  const { DagRuntime } = await import('@dagdev/runtime');
  return DagRuntime;
};

interface RunOptions {
  network?: string;
}

export async function runCommand(
  scriptPath: string,
  options: RunOptions = {}
): Promise<void> {
  logger.title('🚀 Running Script');

  try {
    // Resolve script path
    const absoluteScriptPath = path.resolve(process.cwd(), scriptPath);
    
    // Check if script exists
    if (!fs.existsSync(absoluteScriptPath)) {
      logger.error(`Script not found: ${scriptPath}`);
      process.exit(1);
    }

    logger.info(`Script: ${scriptPath}`);
    logger.info(`Network: ${options.network || 'local'}`);
    console.log('');

    // Load configuration
    const spinner = createSpinner('Loading configuration...');
    let config;
    try {
      config = await ConfigLoader.load();
      spinner.succeed('Configuration loaded');
    } catch (error) {
      spinner.warn('Using default configuration');
      config = {
        networks: {
          local: {
            url: 'http://localhost:8545',
            wsUrl: 'ws://localhost:8546',
            chainId: 1337
          }
        }
      };
    }

    // Get network configuration
    const networkName = options.network || 'local';
    const networkConfig = config.networks?.[networkName];
    
    if (!networkConfig) {
      logger.error(`Network not found in config: ${networkName}`);
      const availableNetworks = Object.keys(config.networks || {}).join(', ');
      logger.info(`Available networks: ${availableNetworks}`);
      process.exit(1);
    }

    // Check if node is running by testing RPC connection
    spinner.start(`Checking connection to ${networkName} network...`);
    
    try {
      const rpcUrl = networkConfig.url || networkConfig.rpcUrl || 'http://localhost:8545';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      if (!response.ok) {
        throw new Error('Node not responding');
      }
      
      spinner.succeed(`Connected to ${networkName}`);
    } catch (error: any) {
      spinner.fail(`Failed to connect to ${networkName}`);
      logger.error('Could not connect to node RPC endpoint');
      logger.info('');
      logger.info('💡 Make sure the node is running:');
      logger.command('dagdev node', 'Start local blockchain node');
      process.exit(1);
    }

    // Execute script
    spinner.start('Executing script...');
    
    try {
      // Dynamically import DagRuntime and AccountManager
      const { DagRuntime, AccountManager } = require('@dagdev/runtime');
      
      // Create AccountManager if we have account configuration
      let accountManager;
      if (networkConfig.accounts) {
        try {
          accountManager = await AccountManager.fromConfig(networkConfig.accounts);
          if (accountManager.hasAccounts()) {
            const addresses = accountManager.getAddresses();
            logger.info(`Loaded ${addresses.length} account(s): ${addresses[0]}`);
          }
        } catch (error: any) {
          logger.warning(`Could not load accounts: ${error.message}`);
        }
      }
      
      // Create DagRuntime instance
      const dagRuntime = await DagRuntime.create({
        rpcUrl: networkConfig.url || networkConfig.rpcUrl || 'http://localhost:8545',
        wsUrl: networkConfig.wsUrl || 'ws://localhost:8546',
        accountManager,
        chainId: networkConfig.chainId
      });
      
      // Dynamically import the script
      const scriptModule = require(absoluteScriptPath);
      
      // Check if script exports a default function
      if (typeof scriptModule.default === 'function') {
        await scriptModule.default(dagRuntime);
      } else if (typeof scriptModule === 'function') {
        await scriptModule(dagRuntime);
      } else {
        throw new Error('Script must export a default function or be a function itself');
      }
      
      spinner.succeed('Script executed successfully');
      
      // Keep connection alive briefly to ensure transactions are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.success('\n✨ Script completed successfully!\n');
      
    } catch (error: any) {
      spinner.fail('Script execution failed');
      logger.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }

  } catch (error: any) {
    logger.error(`Failed to run script: ${error.message}`);
    process.exit(1);
  }
}
