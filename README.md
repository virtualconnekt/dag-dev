# 🚀 DagDev

> **Development Framework For BlockDAG Network** - A complete developer toolkit for building on BlockDAG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Release: v1.0.5](https://img.shields.io/badge/release-v1.0.5-blue)](https://github.com/virtualconnekt/dag-dev/releases)
[![npm version](https://img.shields.io/npm/v/dagdev.svg)](https://www.npmjs.com/package/dagdev)

## 🌟 What is DagDev?

DagDev is a comprehensive development environment for BlockDAG networks, bringing the power and ease of Hardhat to DAG-based blockchains. Build, test, and deploy smart contracts on parallel block structures with real-time visualization.

### ✨ Key Features

- 🔷 **Local DAG Blockchain** - Run a complete BlockDAG network locally with parallel block mining
- 🔐 **Account Management** - Secure private key management via .env files, HD wallet support
- 🧪 **DAG-Aware Testing** - Comprehensive test framework with DAG-specific helpers and matchers
- 📊 **Real-Time Visualizer** - Beautiful D3.js graph showing blue/red block coloring and DAG structure
- ⚡ **Full EVM Support** - Deploy and interact with Solidity smart contracts
- 🛠️ **Familiar CLI** - Hardhat-inspired commands that developers already know
- 🎯 **Runtime Environment** - DRE with helper APIs for DAG operations (mining, confirmation, blue set)
- 🌐 **Multi-Network** - Support for local development and remote testnets/mainnet
- 📝 **Solidity Compiler** - Integrated real Solidity compiler with artifact generation
- 🔗 **Transaction Signing** - Built-in transaction signing with @ethereumjs/tx

## 📦 Installation

### ⚙️ Prerequisites

**Node.js 18 or higher is required.**

Check your Node.js version:
```bash
node --version  # Should show v18.0.0 or higher
```

**Don't have Node.js 18+?** Download it from:
- **Official Website**: https://nodejs.org (LTS recommended)
- **Windows**: Use the installer from nodejs.org
- **macOS**: `brew install node@18` or download from nodejs.org
- **Linux**: 
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # Or use nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18
  ```

### Option 1: npm/npx (Quickest - Recommended!)

Perfect for developers with Node.js 18+ installed.

#### Global Installation
```bash
# Install globally
npm install -g dagdev

# Verify installation
dagdev --version  # Should show v1.0.5+

# Create a new project
dagdev init my-project
```

#### Using npx (No Installation Needed)
```bash
# Use directly without installing
npx dagdev@latest init my-project
cd my-project
npx dagdev@latest compile
npx dagdev@latest run scripts/deploy.js --network bdagTestnet
```

#### Local Project Installation
```bash
# Install in your project
npm install --save-dev dagdev

# Use via npx
npx dagdev compile
```

**npm Package:** https://www.npmjs.com/package/dagdev

### Option 2: Standalone Executables (No Node.js Required!)

Perfect for users who don't have Node.js installed or want a simple installation.

#### Linux
```bash
# Download
wget https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-linux

# Make executable
chmod +x dagdev-linux

# Move to PATH (optional)
sudo mv dagdev-linux /usr/local/bin/dagdev

# Verify
dagdev --version
```

#### macOS
```bash
# Download
curl -L https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-macos -o dagdev-macos

# Make executable
chmod +x dagdev-macos

# Move to PATH (optional)
sudo mv dagdev-macos /usr/local/bin/dagdev

# Verify
dagdev --version
```

#### Windows
1. Download [dagdev-win.exe](https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-win.exe)
2. Add to PATH or run directly: `.\dagdev-win.exe --version`

**File Sizes:** Linux (70MB) | macOS (75MB) | Windows (62MB)

### Option 2: Via NPM (Requires Node.js 18+)

```bash
# Install globally
npm install -g dagdev

# Verify installation
dagdev --version
```

### Option 3: From Source

```bash
# Clone repository
git clone https://github.com/virtualconnekt/dag-dev.git
cd dag-dev

# Install dependencies
npm install

# Build packages
npm run build

# Link CLI globally
cd cli && npm link

# Verify
dagdev --version
```

## � Quick Start

```bash
# 1. Create a new project
dagdev init my-blockchain-app
cd my-blockchain-app

# 2. Start local blockchain (Terminal 1)
dagdev node

# 3. In another terminal, compile contracts
dagdev compile

# 4. Deploy your contracts
dagdev run scripts/deploy.js

# 5. Run tests
dagdev test

# 6. Visualize the DAG
dagdev visualize
```

## 🛠️ CLI Commands

### Project Management
```bash
dagdev init <project>        # Create new DagDev project
dagdev compile              # Compile Solidity contracts
dagdev clean                # Clean cache and artifacts
```

### Network & Node
```bash
dagdev node                 # Start local DAG blockchain
dagdev node --network bdagTestnet  # Show remote network info
dagdev accounts             # List available accounts
```

### Development
```bash
dagdev run <script>         # Run deployment scripts
dagdev test [files...]      # Run test suites
dagdev visualize            # Open DAG visualizer
dagdev console              # Interactive console (coming soon)
```

## 📁 Project Structure

When you run `dagdev init`, you get a complete project structure:

```
my-blockchain-app/
├── contracts/              # Solidity smart contracts
│   └── Storage.sol
├── test/                   # Test files
│   └── Storage.test.ts
├── scripts/                # Deployment scripts
│   └── deploy.js
├── artifacts/              # Compiled contract artifacts (generated)
├── cache/                  # Build cache (generated)
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── dagdev.config.js        # Project configuration
├── package.json            # Node.js package file
└── README.md               # Project documentation
```

## ⚙️ Configuration

Example `dagdev.config.js`:

```javascript
module.exports = {
  networks: {
    // Local development network
    local: {
      rpcUrl: 'http://127.0.0.1:8545',
      wsUrl: 'ws://127.0.0.1:8546',
      chainId: 1337,
      accounts: 'hardhat', // 10 pre-funded test accounts
      timeout: 30000,
    },
    
    // BlockDAG Testnet
    bdagTestnet: {
      rpcUrl: 'https://rpc.awakening.bdagscan.com',
      chainId: 1043,
      accounts: {
        privateKeys: process.env.BDAG_TESTNET_PRIVATE_KEY ? 
          [process.env.BDAG_TESTNET_PRIVATE_KEY] : [],
      },
      gasPrice: 'auto',
      confirmations: 3,
      explorer: 'https://awakening.bdagscan.com',
    },
  },
  
  // DAG-specific settings
  dag: {
    parallelism: 2,        // Number of parallel blocks
    k: 18,                 // PHANTOM k parameter
    blueThreshold: 0.8,    // Blue set threshold
    maxParents: 3,         // Max parent blocks per block
    miningInterval: 2000,  // Mining interval in ms
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
  
  // File paths
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    scripts: './scripts',
  },
  
  defaultNetwork: 'local',
};
```

## 🔐 Account Management

### Using .env File (Recommended)

```bash
# Create .env file from template
cp .env.example .env

# Add your private key
echo "BDAG_TESTNET_PRIVATE_KEY=0xyour_private_key_here" >> .env
```

### Test Accounts

DagDev provides 10 pre-funded test accounts (compatible with Hardhat):

```javascript
// In your scripts/tests, accounts are available via:
const accounts = await dagRuntime.evm.getAccounts();
console.log('Deployer:', accounts[0]);
```

**Default accounts have 10,000 ETH each for testing.**

## 📝 Example: Deploy a Contract

```javascript
// scripts/deploy.js
async function main(dagRuntime) {
  // Load compiled contract
  const Storage = require('../artifacts/Storage.json');
  
  // Get deployer account
  const accounts = await dagRuntime.evm.getAccounts();
  const deployer = accounts[0];
  
  console.log('Deploying with account:', deployer);
  
  // Deploy contract
  const result = await dagRuntime.evm.deploy(
    Storage.bytecode,
    deployer,
    { gasLimit: 1000000 }
  );
  
  console.log('Contract deployed at:', result.address);
  console.log('Transaction hash:', result.transactionHash);
  
  // Wait for confirmation
  await dagRuntime.mining.waitForBlocks(3);
  console.log('Deployment confirmed!');
  
  // Interact with contract
  const tx = await dagRuntime.evm.sendTransaction({
    from: deployer,
    to: result.address,
    data: '0x6057361d000000000000000000000000000000000000000000000000000000000000002a', // store(42)
    gasLimit: 100000
  });
  
  console.log('Value stored, tx:', tx.hash);
}

module.exports = { default: main };
```

Run it:
```bash
dagdev run scripts/deploy.js
```

## 🧪 Example: Write Tests

```typescript
// test/Storage.test.ts
import { expect } from 'chai';
import { DagTestRunner } from '@dagdev/testing';

describe('Storage Contract', function() {
  let dagRuntime: any;
  let storage: any;
  let deployer: string;
  
  before(async function() {
    dagRuntime = await DagTestRunner.create();
    const accounts = await dagRuntime.evm.getAccounts();
    deployer = accounts[0];
    
    // Deploy contract
    const Storage = require('../artifacts/Storage.json');
    const result = await dagRuntime.evm.deploy(
      Storage.bytecode,
      deployer
    );
    storage = result.address;
  });
  
  it('should store and retrieve a value', async function() {
    // Store value
    await dagRuntime.evm.sendTransaction({
      from: deployer,
      to: storage,
      data: '0x6057361d000000000000000000000000000000000000000000000000000000000000002a', // store(42)
    });
    
    // Wait for confirmation
    await dagRuntime.mining.waitForBlocks(1);
    
    // Retrieve value
    const result = await dagRuntime.evm.call({
      to: storage,
      data: '0x2e64cec1' // retrieve()
    });
    
    expect(parseInt(result, 16)).to.equal(42);
  });
  
  it('should confirm transactions in the blue set', async function() {
    const depth = await dagRuntime.dag.getDepth();
    expect(depth).to.be.greaterThan(0);
  });
});
```

Run tests:
```bash
dagdev test
```

## 📦 Architecture

This is a monorepo containing:

- **[@dagdev/core](packages/core)** - DAG blockchain implementation with PHANTOM consensus
- **[@dagdev/runtime](packages/runtime)** - Dag Runtime Environment (DRE) with helper APIs
- **[@dagdev/testing](packages/testing)** - Testing framework with DAG-specific matchers
- **[@dagdev/compiler](packages/compiler)** - Solidity compiler wrapper
- **[@dagdev/config](packages/config)** - Configuration management system
- **[@dagdev/visualizer](packages/visualizer)** - Real-time DAG visualization with D3.js
- **[dagdev](cli)** - Command-line interface

## � Features in Detail

### PHANTOM Consensus
- Implements PHANTOM protocol for DAG consensus
- Configurable k-parameter (default: 18)
- Blue set calculation and validation
- Parallel block mining support
- Anticone analysis

### EVM Integration
- Full Ethereum Virtual Machine support
- Deploy and interact with Solidity contracts
- Transaction pool management
- State management with merkle proofs
- Gas estimation and tracking

### Developer Experience
- Hot reload during development
- Detailed error messages
- Transaction confirmation tracking
- Built-in block explorer
- Real-time DAG visualization

### Testing Framework
- Mocha/Chai integration
- DAG-specific test helpers
- Custom matchers for blue set validation
- Parallel block mining in tests
- Confirmation waiting utilities

## 🌐 Network Support

### Local Development ✅
- Start instant local blockchain
- 10 pre-funded test accounts
- Fast block mining
- Full DAG visualization
- No external dependencies

### Remote Networks ✅
- BlockDAG Testnet (pre-configured)
- Custom RPC endpoints
- Transaction signing
- Account management via .env
- Multi-network deployment

### Testnets (Planned)
- Ethereum Sepolia
- Polygon Mumbai
- BSC Testnet
- Custom EVM networks

## �🏗️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific package
npm run build -w packages/core

# Run tests
npm run test

# Development mode (watch)
npm run dev

# Clean build artifacts
npm run clean
```

## 🐛 Troubleshooting

### "Command not found: dagdev"
```bash
# If using executable
chmod +x dagdev-linux && sudo mv dagdev-linux /usr/local/bin/dagdev

# If using npm
npm install -g dagdev
```

### "Failed to connect to node"
```bash
# Make sure node is running
dagdev node

# Check if port 8545 is available
lsof -i :8545
```

### "Contract deployment failed"
- Ensure you have sufficient gas
- Check contract bytecode is valid
- Verify network configuration
- Check account has funds (for testnets)

### macOS "unidentified developer" error
```bash
xattr -d com.apple.quarantine dagdev-macos
```

## 📊 Stats & Performance

- **7 CLI commands** fully functional
- **10 pre-funded test accounts** (10,000 ETH each)
- **PHANTOM consensus** implemented
- **Full EVM support** with state management
- **< 2s** average block time (configurable)
- **Parallel block mining** (2-3 blocks simultaneously)
- **Real-time visualization** with WebSocket updates

## 🗺️ Roadmap

### v1.1.0 (Next)
- [ ] Fix BlockDAG testnet compatibility
- [ ] Contract verification
- [ ] Enhanced error messages
- [ ] Performance optimizations
- [ ] Interactive console (REPL)

### v1.2.0
- [ ] Hardhat plugin compatibility
- [ ] Remix integration
- [ ] Gas optimization analyzer
- [ ] Multi-contract deployment
- [ ] Deployment scripts generator

### v2.0.0
- [ ] Mainnet support
- [ ] Contract upgrades
- [ ] Advanced DAG analytics
- [ ] GraphQL API
- [ ] Web-based IDE integration

## 📚 Documentation

- [Installation Guide](cli/dist/executables/INSTALL.md)
- [Release Notes](cli/dist/executables/RELEASE_NOTES.md)
- [Development Roadmap](DEVELOPMENT_ROADMAP.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [DAG Structure](docs/DAG_STRUCTURE.md)
- [API Reference](docs/) - Coming soon
- [Contributing Guide](CONTRIBUTING.md) - Coming soon

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/virtualconnekt/dag-dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/virtualconnekt/dag-dev/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/virtualconnekt/dag-dev/wiki)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report bugs** - Open an issue with reproduction steps
2. **Suggest features** - Share your ideas in discussions
3. **Submit PRs** - Fork, create a feature branch, and submit a pull request
4. **Improve docs** - Help us make documentation better
5. **Share feedback** - Tell us about your experience

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/dag-dev.git
cd dag-dev

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Make your changes and submit a PR!
```

## 🎖️ Contributors

Thanks to all contributors who have helped build DagDev!

<!-- Add contributors here -->

## 📄 License

MIT © DagDev Team

See [LICENSE](LICENSE) for more details.

## 🙏 Acknowledgments

- **Inspired by Hardhat** - The amazing developer experience
- **PHANTOM Protocol** - By Yonatan Sompolinsky and Aviv Zohar
- **Ethereum Foundation** - For the EVM implementation
- **BlockDAG Team** - For the innovative DAG architecture

## 🔗 Links

- **GitHub**: https://github.com/virtualconnekt/dag-dev
- **Releases**: https://github.com/virtualconnekt/dag-dev/releases
- **npm**: https://www.npmjs.com/package/dagdev (coming soon)
- **Documentation**: https://github.com/virtualconnekt/dag-dev/wiki (coming soon)

## ⭐ Star History

If you find DagDev useful, please consider giving it a star on GitHub! ⭐

---

**Built with ❤️ for the decentralized future**

**Made for developers, by developers.**
