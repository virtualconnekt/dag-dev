/**
 * index.ts
 * 
 * Main entry point for @dagdev/runtime package.
 * Exports the Dag Runtime Environment (DRE).
 * 
 * @phase Phase 4 - Runtime Environment (DRE)
 */

export { DagRuntime } from './DagRuntime';
export { RPCNodeClient } from './RPCNodeClient';
export { AccountManager } from './AccountManager';
export type { Account } from './AccountManager';
export * from './helpers/dag';
export * from './helpers/evm';
export * from './helpers/mining';
