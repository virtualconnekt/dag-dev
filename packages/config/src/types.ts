/**
 * types.ts
 * 
 * TypeScript interfaces for DagDev configuration.
 * Defines the structure of dagdev.config.ts files.
 * 
 * @phase Phase 6 - Configuration System
 */

/**
 * Account configuration for network
 */
export interface AccountsConfig {
  mnemonic?: string;        // BIP39 mnemonic phrase
  privateKeys?: string[];   // Array of private keys
  path?: string;            // HD derivation path (default: "m/44'/60'/0'/0")
  count?: number;           // Number of accounts to derive from mnemonic
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  rpcUrl?: string;          // HTTP RPC endpoint URL (for compatibility)
  url?: string;             // Alias for rpcUrl
  wsUrl?: string;           // WebSocket endpoint URL
  chainId: number;          // Chain ID
  accounts?: AccountsConfig | 'hardhat' | string[];  // Account configuration
  timeout?: number;         // Request timeout in ms
  gasPrice?: number | 'auto'; // Gas price in wei or 'auto'
  gasMultiplier?: number;   // Gas price multiplier (default: 1.0)
  confirmations?: number;   // Number of confirmations to wait
  explorer?: string;        // Block explorer URL
}

/**
 * DAG-specific parameters
 */
export interface DAGConfig {
  parallelism: number;   // Number of blocks to mine in parallel (default: 2-3)
  k: number;             // GHOSTDAG k parameter (default: 18)
  blueThreshold: number; // Blue set confirmation threshold (default: 0.8)
  maxParents: number;    // Maximum parent references per block (default: 3)
  miningInterval: number; // Mining interval in ms (default: 2000)
}

/**
 * Solidity compiler configuration
 */
export interface SolidityConfig {
  version: string;       // Solidity compiler version (e.g., "0.8.19")
  settings?: {
    optimizer?: {
      enabled: boolean;
      runs: number;
    };
    evmVersion?: string;
  };
}

/**
 * Path configuration
 */
export interface PathsConfig {
  sources: string;       // Contract source directory (default: "./contracts")
  tests: string;         // Test directory (default: "./test")
  cache: string;         // Cache directory (default: "./cache")
  artifacts: string;     // Artifacts directory (default: "./artifacts")
  scripts: string;       // Scripts directory (default: "./scripts")
}

/**
 * Main DagDev configuration
 */
export interface DagDevConfig {
  /**
   * Network configurations
   */
  networks: {
    local?: NetworkConfig;
    testnet?: NetworkConfig;
    mainnet?: NetworkConfig;
    [key: string]: NetworkConfig | undefined;
  };

  /**
   * DAG-specific settings
   */
  dag: DAGConfig;

  /**
   * Solidity compiler settings
   */
  solidity: SolidityConfig | string;  // Can be version string or full config

  /**
   * Project paths
   */
  paths?: PathsConfig;

  /**
   * Default network name
   */
  defaultNetwork?: string;
}

/**
 * User config (partial, allows overrides)
 */
export type UserConfig = Partial<DagDevConfig> & {
  networks?: { [key: string]: Partial<NetworkConfig> };
  dag?: Partial<DAGConfig>;
  paths?: Partial<PathsConfig>;
};
