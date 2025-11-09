/**
 * types.ts
 * 
 * TypeScript interfaces for DagDev configuration.
 * Defines the structure of dagdev.config.ts files.
 * 
 * @phase Phase 6 - Configuration System
 */

/**
 * Network configuration
 */
export interface NetworkConfig {
  url: string;           // RPC endpoint URL
  chainId?: number;      // Chain ID
  accounts?: string[];   // Private keys for accounts
  timeout?: number;      // Request timeout
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
