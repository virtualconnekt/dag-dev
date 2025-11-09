# 🚀 DagDev

> **Hardhat for BlockDAG Networks** - A complete developer toolkit for building on BlockDAG

[![npm version](https://badge.fury.io/js/dagdev.svg)](https://www.npmjs.com/package/dagdev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 What is DagDev?

DagDev is a comprehensive development environment for BlockDAG networks, bringing the power and ease of Hardhat to DAG-based blockchains. Build, test, and deploy smart contracts on parallel block structures with real-time visualization.

### Key Features

- 🔷 **Local DAG Simulator** - Run a BlockDAG network on your machine with parallel block mining
- 🧪 **DAG-Aware Testing** - Test framework with DAG-specific helpers and matchers
- 📊 **Real-Time Visualizer** - Beautiful D3.js graph showing blue/red block coloring
- ⚡ **EVM Support** - Deploy and interact with Solidity smart contracts
- 🛠️ **Developer Tools** - Familiar CLI commands like Hardhat
- 🎯 **Runtime Environment** - Helper APIs for DAG operations

## 🚀 Quick Start

```bash
# Install globally
npm install -g dagdev

# Create new project
dagdev init my-dag-dapp
cd my-dag-dapp

# Start local DAG node
dagdev node

# Open visualizer (in another terminal)
dagdev visualize

# Run tests
dagdev test

# Deploy contracts
dagdev run scripts/deploy.ts
```

## 📦 Packages

This is a monorepo containing:

- **[@dagdev/core](packages/core)** - DAG simulator and node implementation
- **[@dagdev/runtime](packages/runtime)** - Dag Runtime Environment (DRE)
- **[@dagdev/testing](packages/testing)** - Testing framework with DAG helpers
- **[@dagdev/compiler](packages/compiler)** - Solidity compilation wrapper
- **[@dagdev/config](packages/config)** - Configuration system
- **[@dagdev/visualizer](packages/visualizer)** - Real-time DAG visualization
- **[dagdev](cli)** - Command-line interface

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Development mode (watch)
npm run dev
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [DAG Concepts](docs/dag-concepts.md)
- [Development Roadmap](DEVELOPMENT_ROADMAP.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © DagDev Team

## 🙏 Acknowledgments

Inspired by Hardhat and built for the BlockDAG ecosystem.

---

**Built with ❤️ for the decentralized future**
