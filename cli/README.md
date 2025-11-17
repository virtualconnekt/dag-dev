# DagDev CLI

**DagDev** - Development framework for BlockDAG networks. Like Hardhat, but for DAG-based blockchains.

## 🚀 Quick Start

### Installation

Install globally via npm:

```bash
npm install -g dagdev
```

Or use npx without installing:

```bash
npx dagdev init my-project
```

### Initialize a New Project

```bash
dagdev init my-project
cd my-project
```

This creates:
- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment scripts
- `test/` - Test files
- `dagdev.config.js` - Configuration file

## 📚 Commands

### `dagdev init <directory>`
Create a new DagDev project

```bash
dagdev init my-dag-project
```

### `dagdev compile`
Compile Solidity contracts

```bash
dagdev compile
# Outputs: artifacts/ directory with compiled contracts
```

### `dagdev node`
Start a local DagDev node

```bash
dagdev node
# Starts node on http://127.0.0.1:8545
# Mining enabled by default
```

### `dagdev run <script>`
Run a deployment or interaction script

```bash
dagdev run scripts/deploy.js --network local
dagdev run scripts/deploy.js --network testnet
```

### `dagdev test`
Run tests

```bash
dagdev test
dagdev test test/mytest.test.js
```

### `dagdev visualize`
Launch DAG visualizer

```bash
dagdev visualize
# Opens http://localhost:3000
```

## ⚙️ Configuration

Create `dagdev.config.js` in your project:

```javascript
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
      mining: {
        enabled: true,
        interval: 2000  // ms between blocks
      }
    },
    testnet: {
      url: "https://testnet.kas.fyi",
      chainId: 10222,
      accounts: ["0xYOUR_PRIVATE_KEY"]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

## 🎯 Example Workflow

```bash
# 1. Create project
dagdev init my-dapp
cd my-dapp

# 2. Add a contract
cat > contracts/Storage.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Storage {
    uint256 value;
    
    function store(uint256 _value) public {
        value = _value;
    }
    
    function retrieve() public view returns (uint256) {
        return value;
    }
}
EOF

# 3. Compile
dagdev compile

# 4. Start local node (in separate terminal)
dagdev node

# 5. Deploy
cat > scripts/deploy.js << EOF
async function main() {
  const Storage = await dag.getContractFactory("Storage");
  const storage = await Storage.deploy();
  await storage.waitForDeployment();
  console.log("Storage deployed to:", await storage.getAddress());
}
main();
EOF

dagdev run scripts/deploy.js

# 6. Test
dagdev test
```

## 🔧 Features

- ✅ **DAG-based blockchain** - Supports BlockDAG consensus
- ✅ **EVM compatible** - Run Solidity smart contracts
- ✅ **Local development node** - Built-in node for testing
- ✅ **Transaction signing** - Full wallet management with private keys
- ✅ **Multi-network support** - Deploy to local, testnet, or custom networks
- ✅ **Testing framework** - Built-in test runner with Mocha/Chai
- ✅ **DAG visualizer** - Visualize the DAG structure in real-time
- ✅ **Hardhat-like API** - Familiar developer experience

## 📖 API Reference

### Runtime Environment (DRE)

Available in scripts and tests as `dag`:

```javascript
// Get contract factory
const Factory = await dag.getContractFactory("MyContract");

// Deploy contract
const contract = await Factory.deploy(arg1, arg2);
await contract.waitForDeployment();

// Get signer
const [signer] = await dag.getSigners();

// Get network
const network = await dag.getNetwork();
console.log(network.name, network.chainId);

// DAG-specific
const dagGraph = await dag.getDAGGraph();
const tips = await dag.getTips();
const blueSet = await dag.getBlueSet();
```

## 🧪 Testing

```javascript
const { expect } = require("chai");

describe("Storage", function() {
  it("Should store and retrieve value", async function() {
    const Storage = await dag.getContractFactory("Storage");
    const storage = await Storage.deploy();
    await storage.waitForDeployment();
    
    await storage.store(42);
    expect(await storage.retrieve()).to.equal(42);
  });
  
  // DAG-specific matchers
  it("Should be in blue set", async function() {
    const tx = await contract.someFunction();
    expect(tx.hash).to.beInBlueSet();
  });
});
```

## 🌐 Networks

### Local Network
```bash
dagdev node  # Start local node
dagdev run scripts/deploy.js --network local
```

### Testnet (BlockDAG/Kaspa Testnet)
```javascript
// dagdev.config.js
module.exports = {
  networks: {
    testnet: {
      url: "https://testnet.kas.fyi",
      chainId: 10222,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

```bash
dagdev run scripts/deploy.js --network testnet
```

## 🔑 Account Management

Load accounts from private keys:

```javascript
// In scripts/deploy.js
const [deployer] = await dag.getSigners();
console.log("Deploying with:", deployer.address);

const balance = await dag.provider.getBalance(deployer.address);
console.log("Balance:", balance.toString());
```

Set private key in `.env`:
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

## 📦 Package Structure

When installed, you get access to:
- `dagdev` - CLI tool (this package)
- `@dagdev/core` - Core DAG implementation
- `@dagdev/runtime` - Runtime environment (DRE)
- `@dagdev/compiler` - Solidity compiler wrapper
- `@dagdev/config` - Configuration system

## 🐛 Troubleshooting

### "Failed to connect to node"
Make sure the local node is running:
```bash
dagdev node  # In separate terminal
```

### "Command not found: dagdev"
Install globally:
```bash
npm install -g dagdev
```

Or use npx:
```bash
npx dagdev --version
```

### Compilation errors
Check Solidity version in `dagdev.config.js` matches your contracts:
```javascript
module.exports = {
  solidity: {
    version: "0.8.30"  // Match pragma version
  }
};
```

## 📚 Resources

- **GitHub**: https://github.com/virtualconnekt/dag-dev
- **Documentation**: https://github.com/virtualconnekt/dag-dev#readme
- **Issues**: https://github.com/virtualconnekt/dag-dev/issues
- **BlockDAG Testnet**: https://testnet.kas.fyi

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! See our GitHub repository for guidelines.

---

Built with ❤️ for the BlockDAG ecosystem
