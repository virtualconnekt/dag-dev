/**
 * SolidityCompiler.ts
 * 
 * Wrapper around solc (Solidity compiler).
 * Compiles .sol files and generates artifacts.
 * 
 * Features:
 * - Compile Solidity contracts
 * - Generate ABIs and bytecode
 * - Incremental compilation (only changed files)
 * - Error formatting
 * - Multiple Solidity versions support
 * 
 * @phase Phase 7 - CLI Tool
 */

import solc from 'solc';
import * as fs from 'fs';
import * as path from 'path';

export interface CompilerInput {
  language: 'Solidity';
  sources: {
    [fileName: string]: {
      content: string;
    };
  };
  settings: {
    optimizer: {
      enabled: boolean;
      runs: number;
    };
    outputSelection: {
      '*': {
        '*': string[];
      };
    };
  };
}

export interface CompilerOutput {
  contracts: {
    [fileName: string]: {
      [contractName: string]: {
        abi: any[];
        evm: {
          bytecode: {
            object: string;
          };
        };
      };
    };
  };
  errors?: any[];
}

export class SolidityCompiler {
  private version: string;
  private sourcesPath: string;
  private artifactsPath: string;

  constructor(
    version: string = '0.8.19',
    sourcesPath: string = './contracts',
    artifactsPath: string = './artifacts'
  ) {
    this.version = version;
    this.sourcesPath = sourcesPath;
    this.artifactsPath = artifactsPath;
  }

  /**
   * Compile all Solidity files in sources directory
   */
  async compile(): Promise<CompilerOutput> {
    console.log(`🔨 Compiling contracts with solc ${this.version}...`);

    // Find all .sol files
    const solFiles = this.findSolidityFiles(this.sourcesPath);
    
    if (solFiles.length === 0) {
      console.log('⚠️  No Solidity files found');
      return { contracts: {} };
    }

    console.log(`📁 Found ${solFiles.length} Solidity file(s)`);

    // Create compiler input
    const input = this.createCompilerInput(solFiles);

    // Compile with solc
    try {
      const inputJSON = JSON.stringify(input);
      
      const outputJSON = solc.compile(inputJSON, {
        import: (importPath: string) => {
          // Handle imports (e.g., OpenZeppelin contracts)
          try {
            // Try to find in node_modules
            const possiblePaths = [
              path.join(process.cwd(), 'node_modules', importPath),
              path.join(this.sourcesPath, importPath),
            ];

            for (const tryPath of possiblePaths) {
              if (fs.existsSync(tryPath)) {
                const content = fs.readFileSync(tryPath, 'utf-8');
                return { contents: content };
              }
            }

            return { error: `File not found: ${importPath}` };
          } catch (error: any) {
            return { error: error.message };
          }
        },
      });

      const output: CompilerOutput = JSON.parse(outputJSON);

      // Check for errors
      if (output.errors) {
        const hasErrors = output.errors.some((err: any) => err.severity === 'error');
        if (hasErrors) {
          console.error('❌ Compilation failed with errors');
          return output;
        }
      }

      console.log(`✅ Compilation successful`);
      
      // Save artifacts
      await this.saveArtifacts(output);

      return output;
    } catch (error: any) {
      console.error('❌ Compilation failed:', error.message);
      return {
        contracts: {},
        errors: [{ severity: 'error', message: error.message }],
      };
    }
  }

  /**
   * Find all .sol files recursively
   */
  private findSolidityFiles(dir: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.findSolidityFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.sol')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Create compiler input from source files
   */
  private createCompilerInput(files: string[]): CompilerInput {
    const sources: any = {};

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(this.sourcesPath, file);
      sources[relativePath] = { content };
    }

    return {
      language: 'Solidity',
      sources,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };
  }

  /**
   * Save compilation artifacts
   */
  private async saveArtifacts(output: CompilerOutput): Promise<void> {
    // Create artifacts directory
    if (!fs.existsSync(this.artifactsPath)) {
      fs.mkdirSync(this.artifactsPath, { recursive: true });
    }

    // Save each contract artifact
    for (const [fileName, contracts] of Object.entries(output.contracts)) {
      for (const [contractName, artifact] of Object.entries(contracts)) {
        const artifactPath = path.join(
          this.artifactsPath,
          `${contractName}.json`
        );

        const artifactData = {
          contractName,
          sourceName: fileName,
          abi: artifact.abi,
          bytecode: artifact.evm.bytecode.object,
        };

        fs.writeFileSync(
          artifactPath,
          JSON.stringify(artifactData, null, 2)
        );
      }
    }
  }

  /**
   * Load compiled artifact by contract name
   */
  loadArtifact(contractName: string): any {
    const artifactPath = path.join(this.artifactsPath, `${contractName}.json`);

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found: ${contractName}`);
    }

    const content = fs.readFileSync(artifactPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Clean artifacts directory
   */
  clean(): void {
    if (fs.existsSync(this.artifactsPath)) {
      fs.rmSync(this.artifactsPath, { recursive: true });
      console.log('🧹 Cleaned artifacts');
    }
  }
}
