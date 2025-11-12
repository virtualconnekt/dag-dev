/**
 * compile.ts
 * 
 * Implementation of `dagdev compile` command.
 * Compiles Solidity contracts using solc.
 * 
 * @phase Phase 7 - CLI Tool
 */

import { ConfigLoader } from '@dagdev/config';
import { SolidityCompiler } from '@dagdev/compiler';
import { logger } from '../utils/logger';
import { createSpinner } from '../utils/spinner';
import * as fs from 'fs';
import * as path from 'path';

interface CompileOptions {
  force?: boolean;
  quiet?: boolean;
}

export async function compileCommand(options: CompileOptions = {}): Promise<void> {
  logger.title('🔨 Compiling Contracts');

  try {
    // Load configuration or use defaults
    const spinner = createSpinner('Loading configuration...');
    let config;
    try {
      config = await ConfigLoader.load();
      spinner.succeed('Configuration loaded');
    } catch (error) {
      spinner.warn('Using default configuration');
      config = {
        paths: {
          sources: './contracts',
          artifacts: './artifacts',
          cache: './cache',
          tests: './test',
          scripts: './scripts'
        },
        solidity: {
          version: '0.8.19',
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        }
      };
    }

    // Check if contracts directory exists
    if (!fs.existsSync(config.paths!.sources)) {
      logger.error(`Contracts directory not found: ${config.paths!.sources}`);
      process.exit(1);
    }

    // Find all Solidity files
    spinner.start('Finding Solidity files...');
    const solidityFiles = findSolidityFiles(config.paths!.sources);
    
    if (solidityFiles.length === 0) {
      spinner.warn('No Solidity files found');
      return;
    }
    
    spinner.succeed(`Found ${solidityFiles.length} Solidity file(s)`);

    // Create compiler
    spinner.start('Initializing compiler...');
    const solcVersion = typeof config.solidity === 'string' 
      ? config.solidity 
      : config.solidity.version;
    
    const compiler = new SolidityCompiler(
      solcVersion,
      config.paths!.sources,
      config.paths!.artifacts
    );
    spinner.succeed('Compiler initialized');

    // Compile contracts
    spinner.start('Compiling contracts...');
    const result = await compiler.compile();
    
    // Check for compilation errors
    if (result.errors && result.errors.length > 0) {
      const errors = result.errors.filter((e: any) => e.severity === 'error');
      const warnings = result.errors.filter((e: any) => e.severity === 'warning');
      
      if (errors.length > 0) {
        spinner.fail('Compilation failed');
        errors.forEach((error: any) => {
          logger.error(error.formattedMessage || error.message);
        });
        process.exit(1);
      }
      
      if (warnings.length > 0) {
        spinner.warn(`Compilation completed with ${warnings.length} warning(s)`);
        warnings.forEach((warning: any) => {
          logger.warning(warning.formattedMessage || warning.message);
        });
      }
    } else {
      spinner.succeed('Compilation successful');
    }

    // Display compilation results
    console.log('');
    logger.section('Compilation Summary');
    
    let totalContracts = 0;
    if (result.contracts) {
      Object.keys(result.contracts).forEach(fileName => {
        const fileContracts = result.contracts[fileName];
        Object.keys(fileContracts).forEach(contractName => {
          logger.info(`✓ ${contractName} (${fileName})`);
          totalContracts++;
        });
      });
    }

    logger.success(`\n${totalContracts} contract(s) compiled successfully\n`);

  } catch (error: any) {
    logger.error(`Compilation failed: ${error.message}`);
    process.exit(1);
  }
}

function findSolidityFiles(dir: string): string[] {
  const files: string[] = [];
  
  function scan(directory: string): void {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.sol')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}
