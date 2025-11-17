# 🎉 DagDev v1.0.0 - First Stable Release

**DagDev** is a complete development framework for BlockDAG networks, inspired by Hardhat. Build, test, and deploy smart contracts on DAG-based blockchains with ease.

## ✨ Features

### 🛠️ Full-Featured CLI
- **`dagdev init`** - Scaffold new projects with best practices
- **`dagdev compile`** - Compile Solidity contracts (uses solc-js)
- **`dagdev node`** - Start local BlockDAG blockchain
- **`dagdev run`** - Execute deployment and utility scripts
- **`dagdev test`** - Run comprehensive test suites
- **`dagdev accounts`** - Manage test accounts
- **`dagdev visualize`** - Visualize DAG structure in browser

### 🔐 Secure Account Management
- Private key management via `.env` files
- HD wallet support (mnemonic phrases)
- 10 pre-funded test accounts (Hardhat-compatible)
- Transaction signing with @ethereumjs/tx

### 🌐 Multi-Network Support
- Local development node (built-in)
- Remote network connections via RPC
- Pre-configured BlockDAG Testnet
- Easy configuration system (`dagdev.config.js`)

### 📝 Smart Contract Development
- Full Solidity compiler integration
- ABI and bytecode artifact generation
- Contract deployment helpers
- Transaction confirmation tracking
- Gas estimation and management

### 🧪 Testing Framework
- DAG-aware test runner
- Custom matchers for DAG operations
- Parallel block mining support
- Blue set confirmation testing
- Comprehensive assertions

### 📊 DAG Features
- PHANTOM consensus implementation
- Parallel block mining (configurable)
- Blue set calculation
- Anticone analysis
- K-parameter configuration
- Real-time DAG visualization

## 📦 Installation

### Option 1: Standalone Executables (Recommended - No Node.js needed!)

Download for your platform:
- **Linux**: `dagdev-linux` (70 MB)
- **macOS**: `dagdev-macos` (75 MB)
- **Windows**: `dagdev-win.exe` (62 MB)

See [INSTALL.md](./INSTALL.md) for detailed instructions.

### Option 2: Via NPM (Requires Node.js)

```bash
npm install -g dagdev
```

## 🚀 Quick Start

```bash
# 1. Create a new project
dagdev init my-dapp
cd my-dapp

# 2. Start local blockchain (Terminal 1)
dagdev node

# 3. Compile contracts (Terminal 2)
dagdev compile

# 4. Deploy contracts
dagdev run scripts/deploy.js

# 5. Run tests
dagdev test

# 6. Visualize DAG
dagdev visualize
```

## 📋 Example Project Structure

```
my-dapp/
├── contracts/
│   └── Storage.sol          # Your smart contracts
├── test/
│   └── Storage.test.ts      # Test files
├── scripts/
│   └── deploy.js            # Deployment scripts
├── artifacts/               # Compiled contracts
├── .env.example             # Environment template
├── dagdev.config.js         # Project configuration
└── package.json
```

## 🔧 Configuration

Example `dagdev.config.js`:

```javascript
module.exports = {
  networks: {
    local: {
      rpcUrl: 'http://127.0.0.1:8545',
      chainId: 1337,
      accounts: 'hardhat', // 10 pre-funded accounts
    },
    bdagTestnet: {
      rpcUrl: 'https://rpc.awakening.bdagscan.com',
      chainId: 1043,
      accounts: {
        privateKeys: process.env.BDAG_TESTNET_PRIVATE_KEY ? 
          [process.env.BDAG_TESTNET_PRIVATE_KEY] : [],
      },
      explorer: 'https://awakening.bdagscan.com',
    },
  },
  
  dag: {
    parallelism: 2,        // Number of parallel blocks
    k: 18,                 // PHANTOM k parameter
    blueThreshold: 0.8,    // Blue set threshold
    maxParents: 3,         // Max parent blocks
    miningInterval: 2000,  // Mining interval (ms)
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
};
```

## 🎯 What's Working

### ✅ Local Development (100%)
- ✅ Project initialization
- ✅ Contract compilation
- ✅ Local blockchain node
- ✅ Contract deployment
- ✅ Contract interactions
- ✅ Test execution
- ✅ DAG visualization
- ✅ Account management

### ✅ Transaction Signing (100%)
- ✅ Private key import
- ✅ Address derivation
- ✅ Transaction signing
- ✅ Nonce management
- ✅ Gas estimation

### ⚠️ Remote Networks (Partial)
- ✅ RPC connection
- ✅ Transaction submission
- ⚠️ BlockDAG Testnet (compatibility being investigated)
- ✅ Standard EVM networks (Sepolia, Mumbai, etc.)

## 🧪 Testing

```bash
# Run all tests
dagdev test

# Run specific test file
dagdev test test/Storage.test.ts

# Watch mode
dagdev test --watch
```

## 📊 Technical Details

### Architecture
- **Monorepo structure** with Lerna
- **TypeScript** throughout
- **Core packages**:
  - `@dagdev/core` - DAG and EVM implementation
  - `@dagdev/compiler` - Solidity compiler wrapper
  - `@dagdev/runtime` - Runtime environment (DRE)
  - `@dagdev/config` - Configuration management
  - `@dagdev/testing` - Test framework

### Dependencies
- **solc-js** - Solidity compiler
- **@ethereumjs/evm** - Ethereum Virtual Machine
- **@ethereumjs/tx** - Transaction signing
- **@ethereumjs/util** - Cryptographic utilities
- **commander** - CLI framework
- **chalk** - Terminal styling

### Consensus
- **PHANTOM protocol** implementation
- Configurable k-parameter
- Blue set calculation
- Parallel block mining
- DAG structure validation

## 🐛 Known Issues

1. **BlockDAG Testnet**: Deployment transactions are submitted and mined but fail during execution (status=0x0). This appears to be a testnet compatibility issue. We're investigating with the BlockDAG team.

2. **Large Executables**: Standalone executables are 60-75 MB because they bundle Node.js runtime. This is normal for pkg-based distributions.

## 🗺️ Roadmap

### v1.1.0 (Upcoming)
- Fix BlockDAG testnet compatibility
- Add contract verification
- Improved error messages
- Performance optimizations

### v1.2.0
- Hardhat plugin compatibility
- Remix integration
- Gas optimization analyzer
- Interactive console (REPL)

### v2.0.0
- Mainnet support
- Multi-contract deployment
- Contract upgrades
- Advanced testing features

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🔗 Links

- **GitHub**: https://github.com/virtualconnekt/dag-dev
- **Issues**: https://github.com/virtualconnekt/dag-dev/issues
- **Discussions**: https://github.com/virtualconnekt/dag-dev/discussions

## 🙏 Acknowledgments

- Inspired by Hardhat
- Built with Ethereum tooling
- PHANTOM consensus by Yonatan Sompolinsky and Aviv Zohar

## 📊 Stats

- **7 CLI commands** fully functional
- **10 pre-funded test accounts**
- **PHANTOM consensus** implemented
- **Full EVM support**
- **100% local deployment success rate**

---

**🎉 Happy Building with DagDev!**

For support, please open an issue on GitHub.
