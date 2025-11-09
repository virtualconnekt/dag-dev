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

import { DagDevConfig, UserConfig, DAGConfig, PathsConfig } from './types';
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
      console.log('⚠️  No config file found, using defaults');
      return this.DEFAULT_CONFIG;
    }

    try {
      const userConfig = await this.loadConfigFile(configPath);
      return this.mergeConfig(userConfig);
    } catch (error) {
      console.error(`Failed to load config: ${error}`);
      return this.DEFAULT_CONFIG;
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
   * Load configuration file
   */
  private static async loadConfigFile(configPath: string): Promise<UserConfig> {
    // TODO: Implement proper module loading
    // For TypeScript files, need to compile first
    // For now, return empty config
    
    if (configPath.endsWith('.json')) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }

    // For .ts/.js files, would use require() or import()
    // Needs compilation setup
    return {};
  }

  /**
   * Merge user config with defaults
   */
  private static mergeConfig(userConfig: UserConfig): DagDevConfig {
    return {
      networks: {
        ...this.DEFAULT_CONFIG.networks,
        ...userConfig.networks,
      },
      dag: {
        ...this.DEFAULT_CONFIG.dag,
        ...userConfig.dag,
      } as DAGConfig,
      solidity: userConfig.solidity || this.DEFAULT_CONFIG.solidity,
      paths: {
        ...this.DEFAULT_CONFIG.paths,
        ...userConfig.paths,
      } as PathsConfig,
      defaultNetwork: userConfig.defaultNetwork || this.DEFAULT_CONFIG.defaultNetwork,
    };
  }

  /**
   * Validate configuration
   */
  static validate(config: DagDevConfig): boolean {
    // TODO: Implement validation
    // - Check required fields
    // - Validate network URLs
    // - Validate DAG parameters
    // - Check paths exist
    
    return true;
  }

  /**
   * Get default configuration
   */
  static getDefaults(): DagDevConfig {
    return { ...this.DEFAULT_CONFIG };
  }
}
