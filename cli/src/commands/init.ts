/**
 * init.ts
 * 
 * Implementation of `dagdev init` command.
 * Scaffolds a new DagDev project with templates.
 * 
 * @phase Phase 7 - CLI Tool
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { logger } from '../utils/logger';
import { createSpinner } from '../utils/spinner';

interface InitOptions {
  template?: string;
  skipInstall?: boolean;
}

export async function initCommand(projectName: string, options: InitOptions): Promise<void> {
  logger.title('🚀 DagDev Project Initialization');
  
  const projectPath = path.resolve(process.cwd(), projectName);
  const template = options.template || 'default';
  
  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    logger.error(`Directory "${projectName}" already exists`);
    process.exit(1);
  }

  logger.info(`Creating project: ${projectName}`);
  logger.info(`Template: ${template}`);
  console.log('');

  try {
    // Create directory structure
    const spinner = createSpinner('Creating project structure...');
    createProjectStructure(projectPath);
    spinner.succeed('Project structure created');

    // Create package.json
    spinner.start('Creating package.json...');
    createPackageJson(projectPath, projectName);
    spinner.succeed('package.json created');

    // Create config file
    spinner.start('Creating dagdev.config.js...');
    createConfigFile(projectPath);
    spinner.succeed('dagdev.config.js created');

    // Create sample contract
    spinner.start('Creating sample contract...');
    createSampleContract(projectPath, template);
    spinner.succeed('Sample contract created');

    // Create test file
    spinner.start('Creating test files...');
    createTestFile(projectPath);
    spinner.succeed('Test files created');

    // Create deployment script
    spinner.start('Creating deployment script...');
    createDeployScript(projectPath);
    spinner.succeed('Deployment script created');

    // Create README
    spinner.start('Creating README...');
    createReadme(projectPath, projectName);
    spinner.succeed('README created');

    // Create .env.example and .gitignore
    spinner.start('Creating environment files...');
    createEnvExample(projectPath);
    createGitignore(projectPath);
    spinner.succeed('Environment files created');

    // Install dependencies
    if (!options.skipInstall) {
      spinner.start('Installing dependencies (this may take a minute)...');
      try {
        execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('Dependencies installed');
      } catch (error) {
        spinner.warn('Failed to install dependencies. Run "npm install" manually.');
      }
    }

    // Success message
    console.log('');
    logger.box('✨ Project Created Successfully!', [
      `Project: ${projectName}`,
      `Location: ${projectPath}`,
      `Template: ${template}`,
      '',
      'Files created:',
      '  📝 contracts/Storage.sol',
      '  🧪 test/Storage.test.ts',
      '  🚀 scripts/deploy.js',
      '  ⚙️  dagdev.config.js',
      '  🔐 .env.example',
    ]);

    logger.section('Next Steps');
    logger.command(`cd ${projectName}`, 'Navigate to your project');
    logger.command('dagdev node', 'Start local blockchain node');
    logger.command('dagdev compile', 'Compile your contracts');
    logger.command('dagdev test', 'Run your tests');
    logger.command('dagdev run scripts/deploy.ts', 'Deploy your contracts');
    console.log('');
    
    logger.info(`Happy building! 🎉\n`);

  } catch (error: any) {
    logger.error(`Failed to initialize project: ${error.message}`);
    process.exit(1);
  }
}

function createProjectStructure(projectPath: string): void {
  const dirs = [
    'contracts',
    'test',
    'scripts',
    'cache',
    'artifacts',
  ];

  dirs.forEach(dir => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  });
}

function createPackageJson(projectPath: string, projectName: string): void {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'A DagDev blockchain project',
    main: 'index.js',
    scripts: {
      'node': 'dagdev node',
      'test': 'dagdev test',
      'compile': 'dagdev compile',
      'deploy': 'dagdev run scripts/deploy.ts'
    },
    keywords: ['dagdev', 'blockchain', 'dag', 'ethereum'],
    author: '',
    license: 'MIT',
    devDependencies: {
      '@dagdev/core': '*',
      '@dagdev/runtime': '*',
      '@dagdev/testing': '*',
      '@dagdev/config': '*',
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0'
    }
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createConfigFile(projectPath: string): void {
  // Create JavaScript config file for better compatibility
  const config = `/**
 * DagDev Configuration
 * 
 * @type {import('@dagdev/config').DagDevConfig}
 */
module.exports = {
  networks: {
    local: {
      rpcUrl: 'http://127.0.0.1:8545',
      wsUrl: 'ws://127.0.0.1:8546',
      chainId: 1337,
      accounts: 'hardhat', // Uses default Hardhat test accounts
      timeout: 30000,
    },
    
    // BlockDAG Testnet Configuration
    bdagTestnet: {
      rpcUrl: 'https://rpc.awakening.bdagscan.com',
      chainId: 1043,
      accounts: {
        // Option 1: Use environment variable (recommended)
        privateKeys: process.env.BDAG_TESTNET_PRIVATE_KEY ? [process.env.BDAG_TESTNET_PRIVATE_KEY] : [],
        
        // Option 2: Use mnemonic from environment
        // mnemonic: process.env.BDAG_TESTNET_MNEMONIC,
        // path: "m/44'/60'/0'/0",
        // count: 10,
      },
      gasPrice: 'auto',
      timeout: 60000,
      confirmations: 3,
      explorer: 'https://awakening.bdagscan.com',
    },
  },

  dag: {
    parallelism: 2,
    k: 18,
    blueThreshold: 0.8,
    maxParents: 3,
    miningInterval: 2000,
  },

  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    scripts: './scripts',
  },

  defaultNetwork: 'local',
};
`;

  fs.writeFileSync(path.join(projectPath, 'dagdev.config.js'), config);
}

function createSampleContract(projectPath: string, template: string): void {
  const contract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Storage
 * @dev Store and retrieve value in a variable
 */
contract Storage {
    uint256 private value;

    event ValueChanged(uint256 newValue);

    /**
     * @dev Store value
     * @param newValue value to store
     */
    function store(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }

    /**
     * @dev Return stored value
     */
    function retrieve() public view returns (uint256) {
        return value;
    }
}
`;

  fs.writeFileSync(
    path.join(projectPath, 'contracts', 'Storage.sol'),
    contract
  );
}

function createTestFile(projectPath: string): void {
  const test = `import { expect, use } from 'chai';
import { dagMatchers, setGlobalNode } from '@dagdev/testing';

use(dagMatchers);

declare global {
  var dagdev: any;
  var dagNode: any;
}

describe('Storage Contract', function() {
  this.timeout(10000);

  before(function() {
    setGlobalNode(dagNode);
  });

  it('should deploy and store a value', async function() {
    // Deploy contract
    const bytecode = '0x...'; // Add your compiled bytecode
    const accounts = await dagdev.evm.createTestAccounts(1, '100');
    
    const result = await dagdev.evm.deploy(bytecode, accounts[0].address);
    expect(result.status).to.equal('0x1');
    
    console.log('Contract deployed at:', result.address);
  });

  it('should retrieve stored value', async function() {
    // Add your test logic here
    const depth = await dagdev.dag.getDepth();
    expect(depth).to.be.a('number');
  });
});
`;

  fs.writeFileSync(
    path.join(projectPath, 'test', 'Storage.test.ts'),
    test
  );
}

function createDeployScript(projectPath: string): void {
  const script = `/**
 * Deployment script for Storage contract
 * 
 * Usage:
 *   1. Start node: dagdev node
 *   2. Deploy: dagdev run scripts/deploy.js
 */

async function main(dagRuntime) {
  console.log('🚀 Deploying Storage contract...\\n');

  // Load compiled contract artifact
  const Storage = require('../artifacts/Storage.json');
  console.log('📦 Loaded contract artifact:', Storage.contractName);

  // Get accounts
  const accounts = await dagRuntime.evm.getAccounts();
  const deployer = accounts[0];
  console.log('👤 Deployer address:', deployer, '\\n');

  // Deploy contract
  console.log('📡 Submitting deployment transaction...');
  const result = await dagRuntime.evm.deploy(
    Storage.bytecode,
    deployer,
    { gasLimit: 1000000 }
  );

  console.log('\\n✅ Contract deployed!');
  console.log('📍 Address:', result.address);
  console.log('🔗 Transaction:', result.transactionHash);
  console.log('⛽ Gas used:', result.gasUsed);

  // Wait for confirmation
  console.log('\\n⏳ Waiting for confirmation...');
  await dagRuntime.mining.waitForBlocks(3);
  console.log('✅ Confirmed in blue set!\\n');

  console.log('✨ Deployment complete!\\n');
  console.log('📝 Contract address:', result.address);
  console.log('� Transaction hash:', result.transactionHash);
}

// Export for dagdev run command
module.exports = { default: main };
`;

  fs.writeFileSync(
    path.join(projectPath, 'scripts', 'deploy.js'),
    script
  );
}

function createReadme(projectPath: string, projectName: string): void {
  const readme = `# ${projectName}

A DagDev blockchain project

## 🚀 Quick Start

\`\`\`bash
# Start local blockchain node
npm run node

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy contracts
npm run deploy
\`\`\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── contracts/       # Solidity smart contracts
├── test/           # Test files
├── scripts/        # Deployment scripts
├── artifacts/      # Compiled contract artifacts
└── dagdev.config.ts # DagDev configuration
\`\`\`

## 📝 Available Commands

- \`dagdev node\` - Start local DAG blockchain
- \`dagdev compile\` - Compile Solidity contracts
- \`dagdev test\` - Run test suite
- \`dagdev run <script>\` - Execute deployment script
- \`dagdev console\` - Open interactive console

## 🔗 Learn More

- [DagDev Documentation](https://github.com/virtualconnekt/dag-dev)
- [BlockDAG Overview](https://github.com/virtualconnekt/dag-dev/docs)
`;

  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    readme
  );
}

function createEnvExample(projectPath: string): void {
  const envExample = `# DagDev Environment Variables
# Copy this file to .env and fill in your values
# DO NOT commit .env to version control!

# BlockDAG Testnet
# Get your private key from your wallet (e.g., MetaMask)
# NEVER share your private key or commit it to git!
BDAG_TESTNET_PRIVATE_KEY=

# Alternative: Use mnemonic phrase (12 or 24 words)
# BDAG_TESTNET_MNEMONIC=

# BlockDAG Mainnet (use with caution!)
# BDAG_MAINNET_PRIVATE_KEY=

# Other network configurations
# CUSTOM_RPC_URL=
# CUSTOM_CHAIN_ID=
`;

  fs.writeFileSync(
    path.join(projectPath, '.env.example'),
    envExample
  );
}

function createGitignore(projectPath: string): void {
  const gitignore = `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
artifacts/
cache/
dist/
build/

# Sensitive data
.dagdev/accounts/
*.key
secrets/
deployments/private/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
`;

  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    gitignore
  );
}


