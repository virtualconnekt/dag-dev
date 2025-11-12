/**
 * index.ts
 * 
 * Main entry point for @dagdev/core package.
 * Exports all core DAG functionality for use by other packages.
 * 
 * @phase Phase 1 - Core DAG Implementation
 */

export { Block, BlockHeader, Transaction } from './dag/Block';
export { DAGGraph } from './dag/DAGGraph';
export { BlueSetAlgorithm } from './dag/BlueSetAlgorithm';
export { Miner, MinerConfig } from './dag/Miner';

// Phase 2 exports
export { LocalNode } from './network/LocalNode';
export { RPCServer } from './network/RPCServer';
export { TransactionPool } from './network/TransactionPool';
export { WebSocketServer } from './network/WebSocketServer';

// Phase 3 exports
export { EVMExecutor } from './evm/EVMExecutor';
export { StateManager } from './evm/StateManager';
