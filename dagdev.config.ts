import { DagDevConfig } from './packages/config/src/types';

/**
 * DagDev Configuration
 * 
 * Define your network endpoints, DAG parameters, and project settings.
 * Supports environment variables using ${VAR_NAME} syntax.
 */
const config: DagDevConfig = {
  // Network configurations
  networks: {
    local: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
      timeout: 30000,
    },
    // Uncomment and set environment variables to use testnet
    // testnet: {
    //   url: '${TESTNET_RPC_URL}',
    //   chainId: 1338,
    //   accounts: ['${PRIVATE_KEY}'], // Private keys for deployment
    // },
  },

  // DAG-specific parameters
  dag: {
    parallelism: 2,        // Mine 2 blocks in parallel
    k: 18,                 // GHOSTDAG k parameter (anticone size)
    blueThreshold: 0.8,    // 80% blue weight for confirmation
    maxParents: 3,         // Maximum parents per block
    miningInterval: 2000,  // Mine every 2 seconds
  },

  // Solidity compiler settings
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // Project paths
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    scripts: './scripts',
  },

  // Default network for commands
  defaultNetwork: 'local',
};

export default config;
