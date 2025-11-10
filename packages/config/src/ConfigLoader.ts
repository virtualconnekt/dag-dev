/**
 * ConfigLoader.ts
 * 
 * Loads and validates dagdev.config.ts configuration files.
 * Supports both TypeScript and JavaScript configs.
 * 
 * Features:
 * - Load config from project root
 * - Merge with default configuration
 * - Validate config structure
 * - Resolve paths
 * - Support environment variables
 * 
 * @phase Phase 6 - Configuration System
 */

import { DagDevConfig, UserConfig, NetworkConfig } from './types';
import * as path from 'path';
import * as fs from 'fs';

export class ConfigLoader {
  private static DEFAULT_CONFIG: DagDevConfig = {
    networks: {
      local: {
        url: 'http://127.0.0.1:8545',
        chainId: 1337,
      },
    },
    dag: {
      parallelism: 2,
      k: 18,
      blueThreshold: 0.8,
      maxParents: 3,
      miningInterval: 2000,
    },
    solidity: '0.8.19',
    paths: {
      sources: './contracts',
      tests: './test',
      cache: './cache',
      artifacts: './artifacts',
      scripts: './scripts',
    },
    defaultNetwork: 'local',
  };

  /**
   * Load configuration from project directory
   */
  static async load(projectPath: string = process.cwd()): Promise<DagDevConfig> {
    const configPath = this.findConfigFile(projectPath);
    
    if (!configPath) {
      console.log('ℹ️  No config file found, using defaults');
      return { ...this.DEFAULT_CONFIG };
    }

    try {
      console.log(`📋 Loading config from: ${path.basename(configPath)}`);
      const userConfig = await this.loadConfigFile(configPath, projectPath);
      const mergedConfig = this.mergeConfig(userConfig, projectPath);
      this.validateConfig(mergedConfig);
      console.log('✅ Configuration loaded successfully');
      return mergedConfig;
    } catch (error: any) {
      console.error(`❌ Failed to load config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find config file in project directory
   * Looks for dagdev.config.ts, dagdev.config.js, dagdev.config.json
   */
  private static findConfigFile(projectPath: string): string | null {
    const configNames = [
      'dagdev.config.ts',
      'dagdev.config.js',
      'dagdev.config.cjs',
      'dagdev.config.mjs',
      'dagdev.config.json',
    ];

    for (const name of configNames) {
      const configPath = path.join(projectPath, name);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  /**
   * Load configuration file (supports .ts, .js, .json)
   */
  private static async loadConfigFile(configPath: string, projectPath: string): Promise<UserConfig> {
    const ext = path.extname(configPath);

    if (ext === '.json') {
      // Load JSON config
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      return this.substituteEnvVars(parsed);
    }

    // For .ts, .js, .mjs, .cjs - use dynamic import
    try {
      // Convert to file:// URL for import
      const fileUrl = `file://${configPath}`;
      const module = await import(fileUrl);
      const config = module.default || module;
      
      if (typeof config === 'function') {
        // Support function configs: export default (env) => ({ ... })
        return this.substituteEnvVars(config(process.env));
      }
      
      return this.substituteEnvVars(config);
    } catch (error: any) {
      throw new Error(`Failed to load config file: ${error.message}`);
    }
  }

  /**
   * Substitute environment variables in config values
   * Supports ${VAR_NAME} syntax
   */
  private static substituteEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || '';
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteEnvVars(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.substituteEnvVars(obj[key]);
      }
      return result;
    }

    return obj;
  }

  /**
   * Merge user config with defaults
   */
  private static mergeConfig(userConfig: UserConfig, projectPath: string = process.cwd()): DagDevConfig {
    const config: DagDevConfig = {
      networks: {
        ...this.DEFAULT_CONFIG.networks,
        ...userConfig.networks,
      },
      dag: {
        ...this.DEFAULT_CONFIG.dag,
        ...userConfig.dag,
      },
      solidity: userConfig.solidity || this.DEFAULT_CONFIG.solidity,
      paths: {
        ...this.DEFAULT_CONFIG.paths,
        ...userConfig.paths,
      },
      defaultNetwork: userConfig.defaultNetwork || this.DEFAULT_CONFIG.defaultNetwork,
    };

    // Resolve paths to absolute
    if (config.paths) {
      config.paths = {
        sources: path.resolve(projectPath, config.paths.sources),
        tests: path.resolve(projectPath, config.paths.tests),
        cache: path.resolve(projectPath, config.paths.cache),
        artifacts: path.resolve(projectPath, config.paths.artifacts),
        scripts: path.resolve(projectPath, config.paths.scripts),
      };
    }

    return config;
  }

  /**
   * Validate configuration
   */
  private static validateConfig(config: DagDevConfig): void {
    // Validate networks
    if (!config.networks || Object.keys(config.networks).length === 0) {
      throw new Error('Configuration must define at least one network');
    }

    // Validate each network
    for (const [name, network] of Object.entries(config.networks)) {
      if (!network) continue;
      
      if (!network.url) {
        throw new Error(`Network "${name}" must have a URL`);
      }

      if (network.chainId !== undefined && typeof network.chainId !== 'number') {
        throw new Error(`Network "${name}" chainId must be a number`);
      }
    }

    // Validate DAG config
    if (config.dag.k < 1) {
      throw new Error('DAG k parameter must be at least 1');
    }

    if (config.dag.parallelism < 1) {
      throw new Error('DAG parallelism must be at least 1');
    }

    if (config.dag.blueThreshold < 0 || config.dag.blueThreshold > 1) {
      throw new Error('DAG blueThreshold must be between 0 and 1');
    }

    if (config.dag.maxParents < 1) {
      throw new Error('DAG maxParents must be at least 1');
    }

    // Validate default network exists
    if (config.defaultNetwork && !config.networks[config.defaultNetwork]) {
      throw new Error(`Default network "${config.defaultNetwork}" is not defined in networks`);
    }

    // Validate solidity version
    if (typeof config.solidity === 'string') {
      if (!config.solidity.match(/^\d+\.\d+\.\d+$/)) {
        throw new Error('Solidity version must be in format "X.Y.Z"');
      }
    }
  }

  /**
   * Get network configuration by name
   */
  static getNetwork(config: DagDevConfig, networkName?: string): NetworkConfig {
    const name = networkName || config.defaultNetwork || 'local';
    const network = config.networks[name];

    if (!network) {
      throw new Error(`Network "${name}" not found in configuration`);
    }

    return network;
  }

  /**
   * Get default configuration (for init command)
   */
  static getDefaultConfig(): DagDevConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Create a sample config file
   */
  static createSampleConfig(outputPath: string): void {
    const sample = `import { DagDevConfig } from '@dagdev/config';

/**
 * DagDev Configuration
 * 
 * Define your network endpoints, DAG parameters, and project settings.
 * Supports environment variables using \${VAR_NAME} syntax.
 */
const config: DagDevConfig = {
  // Network configurations
  networks: {
    local: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
      timeout: 30000,
    },
    testnet: {
      url: '\${TESTNET_RPC_URL}',
      chainId: 1338,
      accounts: ['\${PRIVATE_KEY}'], // Private keys for deployment
    },
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
`;

    fs.writeFileSync(outputPath, sample, 'utf-8');
    console.log(`✅ Created sample config: ${outputPath}`);
  }
}
